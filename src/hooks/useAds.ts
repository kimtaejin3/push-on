import {useCallback, useEffect, useRef, useState} from 'react';
import {useQuery} from '@tanstack/react-query';
import {AdEventType, InterstitialAd} from 'react-native-google-mobile-ads';
import {adConfigQueryOptions} from '../tanstack-query/queryOptions/appConfig';
import {
  AdConfig,
  AdState,
  recordInterstitialShown,
  recordTestDay as markTestDay,
  recordWorkoutCompleted,
  shouldShowInterstitial,
} from '../domain/adFrequency';
import {loadAdState, saveAdState} from '../utils/adState';
import {initializeAdsSdk, isAdsSdkReady} from '../utils/adsSdk';
import {isConsentFlowDone, subscribeConsentFlowDone} from '../utils/adsConsent';
import {adRequestOptions, INTERSTITIAL_AD_UNIT_ID} from '../constants/ads';

// 미리 불러오기가 끝내 응답이 없으면 버린다. 멈춘 로드가 다음 준비를 영영 막지 않게 한다
const INTERSTITIAL_LOAD_TIMEOUT_MS = 30 * 1000;
// 불러 둔 광고는 1시간 뒤 만료된다(AdMob). 그 전에 버리고 새로 불러온다
const INTERSTITIAL_MAX_AGE_MS = 55 * 60 * 1000;
// showInterstitial()(예전 호출 방식)이 준비를 기다리는 최대 시간
const INTERSTITIAL_READY_WAIT_MS = 3000;
// show() 부터 닫힘까지의 전체 상한. 열림·닫힘 신호가 끝내 오지 않아도 호출자가 영원히 기다리지 않는다
const INTERSTITIAL_SHOW_TIMEOUT_MS = 90 * 1000;

/*
 * 노출 기록은 읽기→수정→저장을 한 줄로 세워 처리한다.
 * 화면마다 useAds 인스턴스가 따로 있어도, 연달아 불러도 매번 최신 저장값에서 출발하므로
 * 서로의 증가분을 덮어쓰지 않는다.
 */
let adStateQueue: Promise<unknown> = Promise.resolve();

const enqueue = <T>(task: () => Promise<T>): Promise<T> => {
  const run = adStateQueue.then(task, task);
  adStateQueue = run.catch(() => undefined);
  return run;
};

const readAdState = () => enqueue(() => loadAdState());

const updateAdState = (update: (state: AdState) => AdState) =>
  enqueue(async () => {
    const next = update(await loadAdState());
    await saveAdState(next);
    return next;
  });

/*
 * 최신 광고 설정. 화면이 마운트된 useAds 가 쿼리 캐시 값을 커밋할 때마다 적는다
 * (AdsBootstrap 이 앱 내내 마운트돼 있어 늘 최신이다). 결과 화면 출구처럼 React 밖에서
 * 보여주기 직전에 설정을 다시 확인할 때 getLatestAdConfig() 로 읽는다.
 */
let latestAdConfig: AdConfig | undefined;

/** 마지막으로 읽은 서버 광고 설정. 아직 못 읽었으면 undefined(→ 광고 없음) */
export const getLatestAdConfig = (): AdConfig | undefined => latestAdConfig;

/*
 * 미리 불러 둔 전면광고 한 칸. 앱 전체에 하나만 둔다.
 * loading: 규칙 확인·요청 옵션·로드 중, ready: 띄울 수 있음. 실패·만료·표시하면 비운다.
 */
type PreparedInterstitial = {
  status: 'loading' | 'ready';
  ad: InterstitialAd | null;
  loadedAt: number;
  // 준비되면 true, 규칙 불통과·로드 실패·시간 초과면 false 로 끝난다
  ready: Promise<boolean>;
  // 로드 단계 리스너·타이머를 걷는다
  release: () => void;
};

let prepared: PreparedInterstitial | null = null;

/*
 * 진행 중인 전면광고 표시. "홈으로" 를 두 번 누르는 등 연달아 불려도 두 번째 호출은 같은 프라미스를
 * 기다리게 해, 광고가 연속으로 뜨거나 노출이 두 번 기록되지 않게 한다.
 * 닫힘·오류·전체 상한(90초)으로 끝날 때까지 풀지 않는다 — "열림" 신호가 늦게 와도 먼저 풀리지 않는다.
 */
let interstitialInFlight: Promise<void> | null = null;

const isStale = (entry: PreparedInterstitial) =>
  entry.status === 'ready' && Date.now() - entry.loadedAt > INTERSTITIAL_MAX_AGE_MS;

const discardPrepared = (entry: PreparedInterstitial) => {
  if (prepared === entry) {
    prepared = null;
  }
  entry.release();
};

/**
 * 전면광고를 미리 불러 둔다. 설정을 읽었고, SDK 가 준비됐고(동의 흐름 완료 포함), 노출 규칙을
 * 통과할 때만 로드를 시작한다. 이미 불러오는 중이거나 준비돼 있으면, 또는 광고가 떠 있으면 무시한다.
 * 어떤 실패도 던지지 않는다 — 실패하면 그냥 준비 안 됨(면제 "로드 실패").
 */
export const prepareInterstitial = (config: AdConfig | undefined): void => {
  if (!config || !isAdsSdkReady() || interstitialInFlight) {
    return;
  }
  if (prepared) {
    if (!isStale(prepared)) {
      return;
    }
    discardPrepared(prepared);
  }

  let resolveReady: (ok: boolean) => void = () => {};
  const entry: PreparedInterstitial = {
    status: 'loading',
    ad: null,
    loadedAt: 0,
    ready: new Promise<boolean>(resolve => {
      resolveReady = resolve;
    }),
    release: () => {},
  };
  // 비동기 확인이 끝나기 전에도 waitInterstitialReady 가 "준비 중" 으로 보도록 바로 자리를 잡는다
  prepared = entry;

  const fail = () => {
    discardPrepared(entry);
    resolveReady(false);
  };

  (async () => {
    try {
      const state = await readAdState();
      if (prepared !== entry || !shouldShowInterstitial(config, state, new Date())) {
        fail();
        return;
      }
      const options = await adRequestOptions();
      if (prepared !== entry) {
        fail();
        return;
      }
      const ad = InterstitialAd.createForAdRequest(INTERSTITIAL_AD_UNIT_ID, options);
      entry.ad = ad;
      const loadTimer = setTimeout(fail, INTERSTITIAL_LOAD_TIMEOUT_MS);
      const unsubscribers = [
        ad.addAdEventListener(AdEventType.LOADED, () => {
          if (prepared !== entry || entry.status !== 'loading') {
            return;
          }
          clearTimeout(loadTimer);
          entry.status = 'ready';
          entry.loadedAt = Date.now();
          resolveReady(true);
        }),
        ad.addAdEventListener(AdEventType.ERROR, error => {
          if (prepared !== entry) {
            return;
          }
          console.warn('[광고] 전면광고 로드 오류:', error);
          fail();
        }),
      ];
      entry.release = () => {
        clearTimeout(loadTimer);
        unsubscribers.forEach(unsubscribe => unsubscribe());
      };
      ad.load();
    } catch (error) {
      console.warn('[광고] 전면광고 준비 중 오류:', error);
      fail();
    }
  })();
};

/**
 * 미리 불러 둔 전면광고가 준비되기를 기다린다. 준비되면 true, timeoutMs 를 넘기거나
 * 불러오는 중인 광고가 없으면(규칙 불통과·실패 포함) false.
 */
export const waitInterstitialReady = (timeoutMs: number): Promise<boolean> => {
  const entry = prepared;
  if (!entry) {
    return Promise.resolve(false);
  }
  if (entry.status === 'ready') {
    return Promise.resolve(!isStale(entry));
  }
  return new Promise(resolve => {
    const timer = setTimeout(() => resolve(false), timeoutMs);
    entry.ready.then(ok => {
      clearTimeout(timer);
      resolve(ok);
    });
  });
};

/**
 * 광고를 띄우고 닫힘·오류·전체 상한(90초)까지 기다린다.
 * 열리면 바로 노출을 기록하고, 끝날 때 그 기록이 저장될 때까지 기다린다.
 */
const presentInterstitial = (ad: InterstitialAd): Promise<void> =>
  new Promise(resolve => {
    let settled = false;
    let recorded: Promise<unknown> = Promise.resolve();
    const unsubscribers: Array<() => void> = [];

    const finish = () => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(capTimer);
      unsubscribers.forEach(unsubscribe => unsubscribe());
      recorded.then(() => resolve());
    };

    const capTimer = setTimeout(finish, INTERSTITIAL_SHOW_TIMEOUT_MS);

    unsubscribers.push(
      ad.addAdEventListener(AdEventType.OPENED, () => {
        if (settled) {
          return;
        }
        recorded = updateAdState(latest => recordInterstitialShown(latest, new Date())).catch(
          error => console.warn('[광고] 전면광고 노출 기록 실패:', error),
        );
      }),
      ad.addAdEventListener(AdEventType.CLOSED, finish),
      ad.addAdEventListener(AdEventType.ERROR, error => {
        console.warn('[광고] 전면광고 오류:', error);
        finish();
      }),
    );

    ad.show().catch(error => {
      console.warn('[광고] 전면광고 표시 실패:', error);
      finish();
    });
  });

const runPreparedInterstitial = async (
  getConfig: () => AdConfig | undefined,
): Promise<void> => {
  try {
    const entry = prepared;
    if (!entry || entry.status !== 'ready' || !entry.ad) {
      return;
    }
    if (isStale(entry)) {
      discardPrepared(entry);
      return;
    }
    const state = await readAdState();
    // 불러오는 사이 서버에서 광고를 껐을 수 있어, 보여주기 직전에 최신 설정으로 다시 확인한다
    const config = getConfig();
    if (
      prepared !== entry ||
      !config ||
      !isAdsSdkReady() ||
      !shouldShowInterstitial(config, state, new Date())
    ) {
      // 준비된 광고는 남겨 둔다(만료 전이면 다음 기회에 쓴다)
      return;
    }
    discardPrepared(entry);
    await presentInterstitial(entry.ad);
  } catch (error) {
    console.warn('[광고] 전면광고 처리 중 오류:', error);
  }
};

/**
 * 미리 불러 둔 전면광고를 띄운다. 준비된 광고가 없으면 바로 끝난다.
 * 보여주기 직전에 getConfig() 로 최신 설정을 다시 규칙에 넣어 통과할 때만 show() 한다.
 * 진행 중에 다시 부르면 같은 프라미스를 돌려준다. 어떤 실패도 던지지 않는다.
 */
export const showPreparedInterstitial = (
  getConfig: () => AdConfig | undefined,
): Promise<void> => {
  if (!interstitialInFlight) {
    interstitialInFlight = runPreparedInterstitial(getConfig).finally(() => {
      interstitialInFlight = null;
    });
  }
  return interstitialInFlight;
};

/** 테스트 전용: 모듈 상태를 처음으로 되돌린다 */
export const resetAdsForTest = () => {
  if (prepared) {
    prepared.release();
  }
  prepared = null;
  interstitialInFlight = null;
  latestAdConfig = undefined;
  adStateQueue = Promise.resolve();
};

export function useAds() {
  const {data: config} = useQuery(adConfigQueryOptions());
  const [consentDone, setConsentDone] = useState(isConsentFlowDone);
  const [sdkReady, setSdkReady] = useState(isAdsSdkReady);

  // 콜백이 오래된 클로저의 설정을 보지 않도록 최신 값을 담아 둔다
  const configRef = useRef(config);
  configRef.current = config;

  useEffect(() => {
    latestAdConfig = config;
  }, [config]);

  const serverAdsEnabled = config?.adsEnabled === true;

  useEffect(() => {
    // 앱 시작 때 저장값 읽기(AdsBootstrap)나 첫 결과 화면의 동의 흐름이 끝나면 알림이 온다
    const unsubscribe = subscribeConsentFlowDone(setConsentDone);
    // 렌더와 구독 사이에 끝났을 수 있어 한 번 더 맞춘다
    setConsentDone(isConsentFlowDone());
    return unsubscribe;
  }, []);

  useEffect(() => {
    // 서버에서 광고를 켰고 동의 흐름을 마쳤을 때만 SDK 를 깨운다. 앱 시작·화면 이동은 기다리지 않는다
    if (!serverAdsEnabled || !consentDone) {
      return;
    }
    let active = true;
    initializeAdsSdk().then(ok => {
      if (active) {
        setSdkReady(ok);
      }
    });
    return () => {
      active = false;
    };
  }, [serverAdsEnabled, consentDone]);

  const prepare = useCallback((): void => {
    prepareInterstitial(configRef.current);
  }, []);

  // 예전 호출 방식: 준비 → 최대 3초 대기 → 보여주기 직전 재확인 뒤 표시
  const showInterstitial = useCallback(async (): Promise<void> => {
    prepareInterstitial(configRef.current);
    if (await waitInterstitialReady(INTERSTITIAL_READY_WAIT_MS)) {
      await showPreparedInterstitial(() => configRef.current);
    }
  }, []);

  const recordWorkout = useCallback(async (): Promise<void> => {
    try {
      await updateAdState(recordWorkoutCompleted);
    } catch (error) {
      console.warn('[광고] 운동 완료 기록 실패:', error);
    }
  }, []);

  const recordTestDay = useCallback(async (): Promise<void> => {
    try {
      await updateAdState(state => markTestDay(state, new Date()));
    } catch (error) {
      console.warn('[광고] 테스트한 날 기록 실패:', error);
    }
  }, []);

  return {
    adsEnabled: serverAdsEnabled && consentDone && sdkReady,
    serverAdsEnabled,
    consentDone,
    showInterstitial,
    recordWorkout,
    recordTestDay,
    prepareInterstitial: prepare,
  };
}
