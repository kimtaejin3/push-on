import {useCallback, useEffect, useRef, useState} from 'react';
import {useQuery} from '@tanstack/react-query';
import {AdEventType, InterstitialAd} from 'react-native-google-mobile-ads';
import {adConfigQueryOptions} from '../tanstack-query/queryOptions/appConfig';
import {
  AdConfig,
  AdState,
  recordInterstitialShown,
  recordWorkoutCompleted,
  shouldShowInterstitial,
} from '../domain/adFrequency';
import {loadAdState, saveAdState} from '../utils/adState';
import {initializeAdsSdk, isAdsSdkReady} from '../utils/adsSdk';
import {AD_REQUEST_OPTIONS, INTERSTITIAL_AD_UNIT_ID} from '../constants/ads';

// 로드가 이보다 오래 걸리면 광고를 포기하고 바로 다음 화면으로 넘어간다
const INTERSTITIAL_LOAD_TIMEOUT_MS = 3000;
// show() 를 부른 뒤 광고가 이 시간 안에 열리지 않으면 포기한다 (결과 화면이 멈추지 않도록)
const INTERSTITIAL_OPEN_TIMEOUT_MS = 5000;
// 광고가 뜬 뒤 닫힘 이벤트가 끝내 오지 않아도 호출자가 영원히 기다리지 않도록 하는 상한
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

/**
 * 전면광고를 로드해 띄운다. 닫히거나 실패하면 끝나고, 실제로 화면에 떴는지를 돌려준다.
 * 로드는 최대 3초, show() 뒤 열림은 최대 5초, 열린 뒤 닫힘은 최대 90초까지만 기다린다.
 */
const loadAndShowInterstitial = (): Promise<boolean> =>
  new Promise(resolve => {
    const ad = InterstitialAd.createForAdRequest(INTERSTITIAL_AD_UNIT_ID, AD_REQUEST_OPTIONS);
    let opened = false;
    let settled = false;
    let showTimer: ReturnType<typeof setTimeout> | undefined;
    const unsubscribers: Array<() => void> = [];

    const finish = () => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(loadTimer);
      clearTimeout(showTimer);
      unsubscribers.forEach(unsubscribe => unsubscribe());
      resolve(opened);
    };

    const loadTimer = setTimeout(finish, INTERSTITIAL_LOAD_TIMEOUT_MS);

    unsubscribers.push(
      ad.addAdEventListener(AdEventType.LOADED, () => {
        if (settled) {
          return;
        }
        clearTimeout(loadTimer);
        showTimer = setTimeout(finish, INTERSTITIAL_OPEN_TIMEOUT_MS);
        ad.show().catch(error => {
          console.warn('[광고] 전면광고 표시 실패:', error);
          finish();
        });
      }),
      ad.addAdEventListener(AdEventType.OPENED, () => {
        if (settled) {
          return;
        }
        opened = true;
        // 열린 뒤에는 사용자가 닫을 때까지 기다리되, 닫힘 이벤트 유실에 대비해 긴 상한만 둔다
        clearTimeout(showTimer);
        showTimer = setTimeout(finish, INTERSTITIAL_SHOW_TIMEOUT_MS);
      }),
      ad.addAdEventListener(AdEventType.CLOSED, finish),
      ad.addAdEventListener(AdEventType.ERROR, error => {
        console.warn('[광고] 전면광고 오류:', error);
        finish();
      }),
    );

    ad.load();
  });

/*
 * 진행 중인 전면광고 처리. "홈으로" 를 두 번 누르는 등 연달아 불려도 두 번째 호출은 같은 프라미스를
 * 기다리게 해, 규칙 검사를 둘 다 통과해 광고가 연속으로 뜨거나 노출이 두 번 기록되지 않게 한다.
 */
let interstitialInFlight: Promise<void> | null = null;

const runInterstitial = async (config: AdConfig | undefined): Promise<void> => {
  try {
    // 설정을 아직 못 읽었거나, 동의·초기화가 끝나지 않았으면 기다리지 않고 넘어간다
    if (!config || !isAdsSdkReady()) {
      return;
    }
    const state = await readAdState();
    if (!shouldShowInterstitial(config, state, new Date())) {
      return;
    }
    const shown = await loadAndShowInterstitial();
    if (shown) {
      await updateAdState(latest => recordInterstitialShown(latest, new Date()));
    }
  } catch (error) {
    console.warn('[광고] 전면광고 처리 중 오류:', error);
  }
};

export function useAds() {
  const {data: config} = useQuery(adConfigQueryOptions());
  const [sdkReady, setSdkReady] = useState(isAdsSdkReady);

  // showInterstitial 이 오래된 클로저의 설정을 보지 않도록 최신 값을 담아 둔다
  const configRef = useRef(config);
  configRef.current = config;

  const serverAdsEnabled = config?.adsEnabled === true;

  useEffect(() => {
    // 서버에서 광고를 켰을 때만 동의를 묻고 SDK 를 깨운다. 앱 시작·화면 이동은 기다리지 않는다
    if (!serverAdsEnabled) {
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
  }, [serverAdsEnabled]);

  const showInterstitial = useCallback((): Promise<void> => {
    if (!interstitialInFlight) {
      interstitialInFlight = runInterstitial(configRef.current).finally(() => {
        interstitialInFlight = null;
      });
    }
    return interstitialInFlight;
  }, []);

  const recordWorkout = useCallback(async (): Promise<void> => {
    try {
      await updateAdState(recordWorkoutCompleted);
    } catch (error) {
      console.warn('[광고] 운동 완료 기록 실패:', error);
    }
  }, []);

  return {
    adsEnabled: serverAdsEnabled && sdkReady,
    showInterstitial,
    recordWorkout,
  };
}
