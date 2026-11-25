import React from 'react';
import {act, create, ReactTestRenderer} from 'react-test-renderer';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import mobileAds, {AdsConsent, InterstitialAd} from 'react-native-google-mobile-ads';
import {AppState, AppStateStatus} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getLatestAdConfig,
  prepareInterstitial,
  resetAdsForTest,
  showPreparedInterstitial,
  useAds,
  waitInterstitialReady,
} from '../../src/hooks/useAds';
import {useAdConfigRefresh} from '../../src/hooks/useAdConfigRefresh';
import {resetAdsSdkForTest} from '../../src/utils/adsSdk';
import {
  CONSENT_FLOW_DONE_STORAGE_KEY,
  loadConsentFlowDone,
  resetAdsConsentForTest,
} from '../../src/utils/adsConsent';
import {loadAdState, saveAdState} from '../../src/utils/adState';
import {getAdConfig} from '../../src/remote/appConfig';
import {AdConfig, AdState, ADS_OFF} from '../../src/domain/adFrequency';

// 전면광고 목: 등록된 리스너를 이벤트 종류별로 보관해 테스트에서 직접 이벤트를 쏜다
type Listener = (payload?: unknown) => void;
let mockListeners: Record<string, Listener[]> = {};
const mockInterstitialLoad = jest.fn();
const mockInterstitialShow = jest.fn(() => Promise.resolve());
const mockInitialize = jest.fn(() => Promise.resolve([]));
const mockSetRequestConfiguration = jest.fn(() => Promise.resolve());

jest.mock('react-native-google-mobile-ads', () => {
  const instance = () => ({
    initialize: mockInitialize,
    setRequestConfiguration: mockSetRequestConfiguration,
  });
  return {
    __esModule: true,
    default: instance,
    AdsConsent: {
      gatherConsent: jest.fn(() => Promise.resolve({canRequestAds: true})),
      getConsentInfo: jest.fn(() => Promise.resolve({canRequestAds: true})),
    },
    AdEventType: {LOADED: 'loaded', ERROR: 'error', OPENED: 'opened', CLOSED: 'closed'},
    MaxAdContentRating: {T: 'T'},
    BannerAdSize: {ANCHORED_ADAPTIVE_BANNER: 'ANCHORED_ADAPTIVE_BANNER'},
    TestIds: {BANNER: 'test-banner', INTERSTITIAL: 'test-interstitial'},
    BannerAd: 'BannerAd',
    InterstitialAd: {
      createForAdRequest: jest.fn(() => ({
        load: mockInterstitialLoad,
        show: mockInterstitialShow,
        addAdEventListener: (type: string, listener: Listener) => {
          (mockListeners[type] ??= []).push(listener);
          return () => {
            mockListeners[type] = mockListeners[type].filter(l => l !== listener);
          };
        },
      })),
    },
  };
});

// 자동 목은 실제 모듈(→ supabase / AsyncStorage)을 로드하므로 팩토리로 대체
jest.mock('../../src/utils/adState', () => ({
  loadAdState: jest.fn(),
  saveAdState: jest.fn(() => Promise.resolve()),
}));
jest.mock('../../src/remote/appConfig', () => ({
  getAdConfig: jest.fn(),
}));

const mockLoadAdState = loadAdState as jest.Mock;
const mockSaveAdState = saveAdState as jest.Mock;
const mockGetAdConfig = getAdConfig as jest.Mock;
const mockCreateInterstitial = InterstitialAd.createForAdRequest as jest.Mock;
const mockGatherConsent = AdsConsent.gatherConsent as jest.Mock;
const mockGetConsentInfo = AdsConsent.getConsentInfo as jest.Mock;

const ADS_ON: AdConfig = {
  adsEnabled: true,
  interstitialEnabled: true,
  dailyCap: 2,
  minGapSeconds: 180,
  graceWorkouts: 1,
};
// 광고 스위치만 끈 설정. 빈도 값은 ADS_ON 과 같아, 꺼짐 외의 이유로 막히지 않는다
const ADS_TURNED_OFF: AdConfig = {...ADS_ON, adsEnabled: false};
// 유예(1회)를 넘긴 상태라 조건을 만족한다
const READY_STATE: AdState = {
  date: '2026-11-21',
  shownToday: 0,
  lastShownAt: null,
  completedWorkouts: 2,
  testDate: null,
};

const emit = (type: string, payload?: unknown) =>
  (mockListeners[type] ?? []).forEach(listener => listener(payload));

// 앱 시작 때 AdsBootstrap 이 하듯, 저장된 "동의 흐름 완료" 를 읽어 메모리에 채운다
const completeConsentFlow = async () => {
  await AsyncStorage.setItem(CONSENT_FLOW_DONE_STORAGE_KEY, '1');
  await loadConsentFlowDone();
};

// 프라미스 체인과 지연 0 타이머(TanStack Query 의 알림 배치)를 비운다. 3초 같은 실제 지연은 건드리지 않는다
const flush = async () => {
  for (let i = 0; i < 40; i++) {
    await Promise.resolve();
    jest.advanceTimersByTime(0);
  }
};

let queryClient: QueryClient;
let renderer: ReactTestRenderer | undefined;

async function renderUseAds() {
  const result = {current: undefined as unknown as ReturnType<typeof useAds>};
  function Probe() {
    result.current = useAds();
    return null;
  }
  await act(async () => {
    renderer = create(
      <QueryClientProvider client={queryClient}>
        <Probe />
      </QueryClientProvider>,
    );
  });
  await act(flush);
  return result;
}

// AdsBootstrap 처럼 설정 구독(useAds)과 주기적 재조회(useAdConfigRefresh)를 함께 둔다
async function renderBootstrap() {
  function Bootstrap() {
    useAds();
    useAdConfigRefresh();
    return null;
  }
  await act(async () => {
    renderer = create(
      <QueryClientProvider client={queryClient}>
        <Bootstrap />
      </QueryClientProvider>,
    );
  });
  await act(flush);
}

beforeEach(async () => {
  jest.clearAllMocks();
  jest.useFakeTimers();
  // READY_STATE 의 날짜와 같은 날(KST 정오)
  jest.setSystemTime(new Date('2026-11-21T03:00:00Z'));
  // 지난 테스트에서 불러 둔 광고를 먼저 치운다(리스너 해제) — 그다음 리스너 목록을 비운다
  resetAdsForTest();
  mockListeners = {};
  resetAdsSdkForTest();
  resetAdsConsentForTest();
  await AsyncStorage.clear();
  // 대부분의 테스트는 동의 흐름을 이미 마친 사용자. 동의 전 동작은 따로 확인한다
  await completeConsentFlow();
  // clearAllMocks 는 구현을 되돌리지 않으므로, 테스트마다 바꾸는 목은 여기서 기본값으로 되돌린다
  mockLoadAdState.mockResolvedValue(READY_STATE);
  mockSaveAdState.mockResolvedValue(undefined);
  mockGetAdConfig.mockResolvedValue(ADS_ON);
  mockGatherConsent.mockResolvedValue({canRequestAds: true});
  mockGetConsentInfo.mockResolvedValue({canRequestAds: true});
  // gc 타이머가 남아 jest 가 끝나지 않는 일이 없도록 캐시 정리 타이머를 끈다
  queryClient = new QueryClient({defaultOptions: {queries: {retry: false, gcTime: Infinity}}});
});

afterEach(() => {
  act(() => renderer?.unmount());
  renderer = undefined;
  queryClient.clear();
  jest.useRealTimers();
});

describe('useAds 전면광고', () => {
  it('설정을 아직 못 읽었으면 전면광고를 띄우지 않는다', async () => {
    // 응답이 오지 않는 조회 → adConfig 쿼리가 로딩 중(undefined)인 상태
    mockGetAdConfig.mockReturnValue(new Promise(() => {}));
    const hook = await renderUseAds();

    await act(() => hook.current.showInterstitial());

    expect(hook.current.adsEnabled).toBe(false);
    expect(mockCreateInterstitial).not.toHaveBeenCalled();
    expect(mockInterstitialShow).not.toHaveBeenCalled();
    expect(mockSaveAdState).not.toHaveBeenCalled();
  });

  it('조건을 만족하면 전면광고를 띄우고 노출을 기록한다', async () => {
    const hook = await renderUseAds();
    expect(hook.current.adsEnabled).toBe(true);

    let done = false;
    const pending = hook.current.showInterstitial().then(() => {
      done = true;
    });
    await act(flush);
    // 요청 옵션은 adRequestOptions() 규칙을 따른다: iOS 에서 앱 추적을 허용했으면(권한 목 기본값) 맞춤 광고
    expect(mockCreateInterstitial).toHaveBeenCalledWith('test-interstitial', {
      requestNonPersonalizedAdsOnly: false,
    });
    expect(mockInterstitialLoad).toHaveBeenCalledTimes(1);

    await act(async () => {
      emit('loaded');
      await flush();
    });
    expect(mockInterstitialShow).toHaveBeenCalledTimes(1);
    await act(async () => {
      emit('opened');
      await flush();
    });
    // 광고가 떠 있는 동안에는 끝나지 않는다 (닫힌 뒤에 화면을 옮기도록)
    expect(done).toBe(false);

    await act(async () => {
      emit('closed');
      await pending;
    });
    expect(done).toBe(true);
    expect(mockSaveAdState).toHaveBeenCalledWith(expect.objectContaining({shownToday: 1}));
  });

  it('광고가 로드되지 않으면 기다리지 않고 끝난다 (노출 기록도 하지 않는다)', async () => {
    const hook = await renderUseAds();

    // load 가 끝내 완료 이벤트를 주지 않는 경우: 3초 뒤에 포기한다
    const pending = hook.current.showInterstitial();
    await act(flush);
    expect(mockInterstitialLoad).toHaveBeenCalledTimes(1);
    await act(async () => {
      jest.advanceTimersByTime(3000);
      await flush();
    });

    await expect(pending).resolves.toBeUndefined();
    // 시간이 지난 뒤 늦게 로드돼도 띄우지 않는다
    emit('loaded');
    expect(mockInterstitialShow).not.toHaveBeenCalled();
    expect(mockSaveAdState).not.toHaveBeenCalled();
  });

  it('조건을 만족하지 않으면 광고를 요청하지 않는다', async () => {
    // 유예 기간(첫 운동)이라 노출하지 않는다
    mockLoadAdState.mockResolvedValue({...READY_STATE, completedWorkouts: 1});
    const hook = await renderUseAds();
    expect(hook.current.adsEnabled).toBe(true);

    await act(() => hook.current.showInterstitial());

    expect(mockCreateInterstitial).not.toHaveBeenCalled();
    expect(mockSaveAdState).not.toHaveBeenCalled();
  });

  it('로드 오류가 나도 예외 없이 끝난다', async () => {
    const hook = await renderUseAds();

    const pending = hook.current.showInterstitial();
    await act(flush);
    expect(mockInterstitialLoad).toHaveBeenCalledTimes(1);
    await act(async () => {
      emit('error', new Error('no fill'));
      await flush();
    });

    await expect(pending).resolves.toBeUndefined();
    expect(mockInterstitialShow).not.toHaveBeenCalled();
    expect(mockSaveAdState).not.toHaveBeenCalled();
  });

  it('광고가 뜬 뒤 닫힘 이벤트가 오지 않아도 결국 끝난다', async () => {
    const hook = await renderUseAds();

    const pending = hook.current.showInterstitial();
    await act(flush);
    await act(async () => {
      emit('loaded');
      await flush();
      emit('opened');
      await flush();
      jest.advanceTimersByTime(90 * 1000);
      await flush();
    });

    await expect(pending).resolves.toBeUndefined();
    expect(mockSaveAdState).toHaveBeenCalledWith(expect.objectContaining({shownToday: 1}));
  });

  it('show() 뒤 열림·닫힘 신호가 끝내 없으면 90초 뒤 끝난다 (노출 기록은 하지 않는다)', async () => {
    const hook = await renderUseAds();

    let done = false;
    const pending = hook.current.showInterstitial().then(() => {
      done = true;
    });
    await act(flush);
    await act(async () => {
      emit('loaded');
      await flush();
    });
    expect(mockInterstitialShow).toHaveBeenCalledTimes(1);

    // 예전처럼 5초에 풀리지 않는다
    await act(async () => {
      jest.advanceTimersByTime(90 * 1000 - 1);
      await flush();
    });
    expect(done).toBe(false);
    await act(async () => {
      jest.advanceTimersByTime(1);
      await flush();
    });

    await pending;
    expect(done).toBe(true);
    expect(mockSaveAdState).not.toHaveBeenCalled();
  });

  it('광고가 열렸으면 5초가 지나도 닫힐 때까지 기다린다', async () => {
    const hook = await renderUseAds();

    let done = false;
    const pending = hook.current.showInterstitial().then(() => {
      done = true;
    });
    await act(flush);
    await act(async () => {
      emit('loaded');
      await flush();
      emit('opened');
      await flush();
      jest.advanceTimersByTime(60 * 1000);
      await flush();
    });
    expect(done).toBe(false);

    await act(async () => {
      emit('closed');
      await pending;
    });
    expect(mockSaveAdState).toHaveBeenCalledWith(expect.objectContaining({shownToday: 1}));
  });

  it('진행 중에 다시 불러도 광고를 한 번만 로드하고 한 번만 기록한다', async () => {
    const hook = await renderUseAds();

    const first = hook.current.showInterstitial();
    const second = hook.current.showInterstitial();
    await act(flush);
    await act(async () => {
      emit('loaded');
      await flush();
      emit('opened');
      await flush();
      emit('closed');
      await Promise.all([first, second]);
    });

    expect(mockCreateInterstitial).toHaveBeenCalledTimes(1);
    expect(mockInterstitialLoad).toHaveBeenCalledTimes(1);
    expect(mockInterstitialShow).toHaveBeenCalledTimes(1);
    expect(mockSaveAdState).toHaveBeenCalledTimes(1);

    // 끝난 뒤의 호출은 새로 진행한다(규칙 확인을 위해 저장값을 다시 읽는다)
    const reads = mockLoadAdState.mock.calls.length;
    mockLoadAdState.mockResolvedValue({...READY_STATE, shownToday: 2});
    await act(() => hook.current.showInterstitial());
    expect(mockLoadAdState.mock.calls.length).toBeGreaterThan(reads);
    expect(mockCreateInterstitial).toHaveBeenCalledTimes(1);
  });
});

describe('전면 미리 불러오기', () => {
  // SDK 가 준비된 상태(동의 완료 + 초기화)에서 광고 하나를 불러 둔다
  async function prepareReady() {
    const hook = await renderUseAds();
    expect(hook.current.adsEnabled).toBe(true);
    act(() => hook.current.prepareInterstitial());
    await act(flush);
    await act(async () => {
      emit('loaded');
      await flush();
    });
    await expect(waitInterstitialReady(0)).resolves.toBe(true);
    return hook;
  }

  it('준비가 1초 안에 안 되면 waitInterstitialReady(1000) 은 false', async () => {
    await renderUseAds();
    prepareInterstitial(ADS_ON);

    let result: boolean | undefined;
    waitInterstitialReady(1000).then(ok => {
      result = ok;
    });
    await act(async () => {
      jest.advanceTimersByTime(999);
      await flush();
    });
    expect(result).toBeUndefined();
    await act(async () => {
      jest.advanceTimersByTime(1);
      await flush();
    });
    expect(result).toBe(false);
  });

  it('불러오는 중에 다시 준비해도 한 번만 로드하고, 로드되면 true', async () => {
    await renderUseAds();
    prepareInterstitial(ADS_ON);
    prepareInterstitial(ADS_ON);

    const ready = waitInterstitialReady(1000);
    await act(flush);
    await act(async () => {
      emit('loaded');
      await flush();
    });

    await expect(ready).resolves.toBe(true);
    expect(mockCreateInterstitial).toHaveBeenCalledTimes(1);
    expect(mockInterstitialLoad).toHaveBeenCalledTimes(1);
    // 준비돼 있으면 또 불러오지 않는다
    prepareInterstitial(ADS_ON);
    await act(flush);
    expect(mockCreateInterstitial).toHaveBeenCalledTimes(1);
  });

  it('규칙을 통과하지 못하면 불러오지 않고 기다림도 바로 false', async () => {
    mockLoadAdState.mockResolvedValue({...READY_STATE, testDate: '2026-11-21'});
    await renderUseAds();
    prepareInterstitial(ADS_ON);

    await act(async () => {
      await expect(waitInterstitialReady(1000)).resolves.toBe(false);
    });
    expect(mockCreateInterstitial).not.toHaveBeenCalled();
  });

  it('보여주기 직전에 서버가 광고를 끄면 show 를 부르지 않는다', async () => {
    const hook = await prepareReady();

    // 불러 둔 사이 서버에서 광고를 껐다(포그라운드 복귀·5분 재조회로 캐시가 바뀜). 다른 값은 그대로
    await act(async () => {
      queryClient.setQueryData(['appConfig', 'ads'], ADS_TURNED_OFF);
      await flush();
    });
    await act(() => hook.current.showInterstitial());

    expect(mockInterstitialShow).not.toHaveBeenCalled();
    expect(mockSaveAdState).not.toHaveBeenCalled();
  });

  it('보여주기 직전 getConfig() 가 꺼짐이면 모듈 함수도 show 를 부르지 않는다', async () => {
    await prepareReady();

    await act(() => showPreparedInterstitial(() => ADS_TURNED_OFF));

    expect(mockInterstitialShow).not.toHaveBeenCalled();
  });

  it('열림 신호가 6초 뒤에 와도 닫힐 때까지 다음 호출은 같은 프라미스를 기다린다', async () => {
    await prepareReady();

    let done = false;
    const first = showPreparedInterstitial(getLatestAdConfig);
    first.then(() => {
      done = true;
    });
    await act(flush);
    expect(mockInterstitialShow).toHaveBeenCalledTimes(1);

    await act(async () => {
      jest.advanceTimersByTime(6000);
      await flush();
    });
    // 5초가 지나도 잠금이 풀리지 않는다
    expect(showPreparedInterstitial(getLatestAdConfig)).toBe(first);
    expect(done).toBe(false);

    await act(async () => {
      emit('opened');
      await flush();
    });
    expect(showPreparedInterstitial(getLatestAdConfig)).toBe(first);
    expect(done).toBe(false);

    await act(async () => {
      emit('closed');
      await first;
    });
    expect(done).toBe(true);
    expect(mockInterstitialShow).toHaveBeenCalledTimes(1);
    expect(mockSaveAdState).toHaveBeenCalledTimes(1);
    expect(mockSaveAdState).toHaveBeenCalledWith(expect.objectContaining({shownToday: 1}));
  });

  it('열린 뒤 닫힘이 없으면 90초 뒤 끝난다', async () => {
    await prepareReady();

    let done = false;
    const pending = showPreparedInterstitial(getLatestAdConfig).then(() => {
      done = true;
    });
    await act(async () => {
      await flush();
      emit('opened');
      await flush();
      jest.advanceTimersByTime(90 * 1000 - 1);
      await flush();
    });
    expect(done).toBe(false);

    await act(async () => {
      jest.advanceTimersByTime(1);
      await flush();
    });
    await pending;
    expect(done).toBe(true);
    expect(mockSaveAdState).toHaveBeenCalledWith(expect.objectContaining({shownToday: 1}));
  });

  it('준비된 광고가 없으면 기다리지 않고 끝난다', async () => {
    await renderUseAds();

    await act(() => showPreparedInterstitial(() => ADS_ON));

    expect(mockInterstitialShow).not.toHaveBeenCalled();
  });

  it('getLatestAdConfig 는 마지막으로 읽은 서버 설정을 돌려준다', async () => {
    expect(getLatestAdConfig()).toBeUndefined();
    await renderUseAds();
    expect(getLatestAdConfig()).toEqual(ADS_ON);

    await act(async () => {
      queryClient.setQueryData(['appConfig', 'ads'], ADS_OFF);
      await flush();
    });
    expect(getLatestAdConfig()).toEqual(ADS_OFF);
  });
});

describe('광고 설정 재조회', () => {
  let appStateListener: ((state: AppStateStatus) => void) | undefined;

  beforeEach(() => {
    appStateListener = undefined;
    (AppState as {currentState: AppStateStatus}).currentState = 'active';
    (AppState.addEventListener as jest.Mock).mockImplementation(
      (_type: string, listener: (state: AppStateStatus) => void) => {
        appStateListener = listener;
        return {remove: jest.fn()};
      },
    );
  });

  const changeAppState = async (state: AppStateStatus) => {
    (AppState as {currentState: AppStateStatus}).currentState = state;
    await act(async () => {
      appStateListener?.(state);
      await flush();
    });
  };

  it('앱이 포그라운드로 돌아오면 서버 설정을 다시 읽어 바로 반영한다', async () => {
    await renderBootstrap();
    expect(mockGetAdConfig).toHaveBeenCalledTimes(1);

    await changeAppState('background');
    expect(mockGetAdConfig).toHaveBeenCalledTimes(1);

    // 백그라운드에 있는 동안 서버에서 광고를 껐다
    mockGetAdConfig.mockResolvedValue(ADS_OFF);
    await changeAppState('active');

    expect(mockGetAdConfig).toHaveBeenCalledTimes(2);
    expect(queryClient.getQueryData(['appConfig', 'ads'])).toEqual(ADS_OFF);
  });

  it('앱이 켜져 있는 동안 5분마다 다시 읽고, 백그라운드에서는 읽지 않는다', async () => {
    await renderBootstrap();
    expect(mockGetAdConfig).toHaveBeenCalledTimes(1);

    await act(async () => {
      jest.advanceTimersByTime(5 * 60 * 1000);
      await flush();
    });
    expect(mockGetAdConfig).toHaveBeenCalledTimes(2);

    await changeAppState('background');
    await act(async () => {
      jest.advanceTimersByTime(15 * 60 * 1000);
      await flush();
    });
    expect(mockGetAdConfig).toHaveBeenCalledTimes(2);
  });
});

describe('useAds 초기화와 운동 기록', () => {
  it('광고가 꺼져 있으면 SDK 를 초기화하지 않고 동의도 묻지 않는다', async () => {
    mockGetAdConfig.mockResolvedValue(ADS_OFF);
    const hook = await renderUseAds();

    await act(() => hook.current.showInterstitial());

    expect(hook.current.adsEnabled).toBe(false);
    expect(hook.current.serverAdsEnabled).toBe(false);
    expect(mockGatherConsent).not.toHaveBeenCalled();
    expect(mockInitialize).not.toHaveBeenCalled();
    expect(mockCreateInterstitial).not.toHaveBeenCalled();
  });

  it('동의 흐름 전이라도 서버가 켜면 첫 실행부터 초기화하고 광고를 켠다', async () => {
    // 처음 설치한 사용자: 동의 흐름(첫 결과 화면)을 아직 안 돌았다
    resetAdsConsentForTest();
    const hook = await renderUseAds();

    expect(hook.current.serverAdsEnabled).toBe(true);
    expect(hook.current.consentDone).toBe(false);
    expect(mockInitialize).toHaveBeenCalledTimes(1);
    expect(hook.current.adsEnabled).toBe(true);
    // 동의 양식은 첫 결과 화면의 동의 흐름이 띄운다
    expect(mockGatherConsent).not.toHaveBeenCalled();
  });

  it('광고가 켜져 있고 동의 흐름을 마쳤으면 SDK 를 한 번만 초기화한다(동의 양식은 띄우지 않는다)', async () => {
    await renderUseAds();
    act(() => renderer?.unmount());
    const hook = await renderUseAds();

    expect(hook.current.consentDone).toBe(true);
    expect(mockGatherConsent).not.toHaveBeenCalled();
    expect(mockSetRequestConfiguration).toHaveBeenCalledTimes(1);
    expect(mockInitialize).toHaveBeenCalledTimes(1);
    expect(mobileAds).toBeDefined();
  });

  it('동의상 광고를 요청할 수 없으면 초기화하지 않고 광고도 끈다', async () => {
    mockGetConsentInfo.mockResolvedValue({canRequestAds: false});
    const hook = await renderUseAds();

    await act(() => hook.current.showInterstitial());

    expect(hook.current.adsEnabled).toBe(false);
    expect(mockInitialize).not.toHaveBeenCalled();
    expect(mockCreateInterstitial).not.toHaveBeenCalled();
  });

  it('recordWorkout 을 연달아 불러도 증가분이 서로 덮어쓰지 않는다', async () => {
    // 저장소처럼 동작하는 목: 저장한 값을 다음 읽기에서 돌려준다
    let stored: AdState = {...READY_STATE, completedWorkouts: 0};
    mockLoadAdState.mockImplementation(async () => stored);
    mockSaveAdState.mockImplementation(async (next: AdState) => {
      stored = next;
    });
    const hook = await renderUseAds();

    await act(() =>
      Promise.all([hook.current.recordWorkout(), hook.current.recordWorkout()]).then(() => undefined),
    );

    expect(stored.completedWorkouts).toBe(2);
  });

  it('저장에 실패해도 recordWorkout 은 예외를 던지지 않는다', async () => {
    mockSaveAdState.mockRejectedValue(new Error('disk full'));
    const hook = await renderUseAds();

    await expect(hook.current.recordWorkout()).resolves.toBeUndefined();
  });

  it('recordTestDay 는 저장된 상태에 오늘 날짜를 남긴다', async () => {
    let stored: AdState = {...READY_STATE, date: '2026-11-20', testDate: null};
    mockLoadAdState.mockImplementation(async () => stored);
    mockSaveAdState.mockImplementation(async (next: AdState) => {
      stored = next;
    });
    const hook = await renderUseAds();

    await act(() => hook.current.recordTestDay());

    expect(stored.testDate).toBe('2026-11-21');
    // 다른 기록은 건드리지 않는다
    expect(stored.completedWorkouts).toBe(READY_STATE.completedWorkouts);
  });

  it('저장에 실패해도 recordTestDay 는 예외를 던지지 않는다', async () => {
    mockSaveAdState.mockRejectedValue(new Error('disk full'));
    const hook = await renderUseAds();

    await expect(hook.current.recordTestDay()).resolves.toBeUndefined();
  });
});
