import React from 'react';
import {act, create, ReactTestRenderer} from 'react-test-renderer';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import mobileAds, {AdsConsent, InterstitialAd} from 'react-native-google-mobile-ads';
import {useAds} from '../../src/hooks/useAds';
import {AdBanner} from '../../src/components/common/AdBanner';
import {resetAdsSdkForTest} from '../../src/utils/adsSdk';
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
// 유예(1회)를 넘긴 상태라 조건을 만족한다
const READY_STATE: AdState = {
  date: '2026-11-21',
  shownToday: 0,
  lastShownAt: null,
  completedWorkouts: 2,
};

const emit = (type: string, payload?: unknown) =>
  (mockListeners[type] ?? []).forEach(listener => listener(payload));

// 프라미스 체인과 지연 0 타이머(TanStack Query 의 알림 배치)를 비운다. 3초 같은 실제 지연은 건드리지 않는다
const flush = async () => {
  for (let i = 0; i < 20; i++) {
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

async function renderAdBanner() {
  await act(async () => {
    renderer = create(
      <QueryClientProvider client={queryClient}>
        <AdBanner />
      </QueryClientProvider>,
    );
  });
  await act(flush);
  return renderer!;
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
  mockListeners = {};
  resetAdsSdkForTest();
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
    expect(mockCreateInterstitial).toHaveBeenCalledWith(
      'test-interstitial',
      expect.objectContaining({requestNonPersonalizedAdsOnly: true}),
    );
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
});

describe('useAds 초기화와 운동 기록', () => {
  it('광고가 꺼져 있으면 SDK 를 초기화하지 않고 동의도 묻지 않는다', async () => {
    mockGetAdConfig.mockResolvedValue(ADS_OFF);
    const hook = await renderUseAds();

    await act(() => hook.current.showInterstitial());

    expect(hook.current.adsEnabled).toBe(false);
    expect(mockGatherConsent).not.toHaveBeenCalled();
    expect(mockInitialize).not.toHaveBeenCalled();
    expect(mockCreateInterstitial).not.toHaveBeenCalled();
  });

  it('광고가 켜져 있으면 동의를 받은 뒤 SDK 를 한 번만 초기화한다', async () => {
    await renderUseAds();
    act(() => renderer?.unmount());
    await renderUseAds();

    expect(mockGatherConsent).toHaveBeenCalledTimes(1);
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
});

describe('AdBanner', () => {
  it('adsEnabled 가 거짓이면 배너를 렌더하지 않는다', async () => {
    mockGetAdConfig.mockResolvedValue(ADS_OFF);
    const tree = await renderAdBanner();
    expect(tree.toJSON()).toBeNull();
  });

  it('설정을 아직 못 읽었으면 배너를 렌더하지 않는다', async () => {
    mockGetAdConfig.mockReturnValue(new Promise(() => {}));
    const tree = await renderAdBanner();
    expect(tree.toJSON()).toBeNull();
  });

  it('광고가 켜져 있으면 비개인화 배너를 렌더하고, 로드에 실패하면 숨긴다', async () => {
    const tree = await renderAdBanner();
    const banner = tree.root.findByProps({unitId: 'test-banner'});
    expect(banner.type).toBe('BannerAd');
    expect(banner.props.requestOptions).toEqual(
      expect.objectContaining({requestNonPersonalizedAdsOnly: true}),
    );

    await act(async () => {
      banner.props.onAdFailedToLoad(new Error('no fill'));
    });
    expect(tree.toJSON()).toBeNull();
  });
});
