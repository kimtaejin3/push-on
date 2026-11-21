import AsyncStorage from '@react-native-async-storage/async-storage';
import {Platform} from 'react-native';
import {AdsConsent} from 'react-native-google-mobile-ads';
import {check, request, RESULTS} from 'react-native-permissions';
import {
  CONSENT_FLOW_DONE_STORAGE_KEY,
  canShowPrivacyOptions,
  getTrackingStatus,
  isConsentFlowDone,
  loadConsentFlowDone,
  requestTracking,
  resetAdsConsentForTest,
  runConsentFlow,
  subscribeConsentFlowDone,
} from '../../src/utils/adsConsent';
import {adRequestOptions} from '../../src/constants/ads';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));
jest.mock('react-native-google-mobile-ads', () => ({
  __esModule: true,
  default: () => ({}),
  AdsConsent: {
    gatherConsent: jest.fn(),
    getConsentInfo: jest.fn(),
    showPrivacyOptionsForm: jest.fn(),
  },
  AdsConsentPrivacyOptionsRequirementStatus: {
    UNKNOWN: 'UNKNOWN',
    REQUIRED: 'REQUIRED',
    NOT_REQUIRED: 'NOT_REQUIRED',
  },
  TestIds: {BANNER: 'test-banner', INTERSTITIAL: 'test-interstitial', NATIVE_VIDEO: 'test-native-video'},
}));

const mockCheck = check as jest.Mock;
const mockRequest = request as jest.Mock;
const mockGather = AdsConsent.gatherConsent as jest.Mock;
const mockConsentInfo = AdsConsent.getConsentInfo as jest.Mock;
const mockGetItem = AsyncStorage.getItem as jest.Mock;
const mockSetItem = AsyncStorage.setItem as jest.Mock;

const setOS = (os: 'ios' | 'android') => jest.replaceProperty(Platform, 'OS', os);

describe('adsConsent', () => {
  let calls: string[];
  let prePrompt: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
    resetAdsConsentForTest();
    calls = [];
    prePrompt = jest.fn(async () => {
      calls.push('prePrompt');
    });
    mockCheck.mockResolvedValue(RESULTS.DENIED); // 이 라이브러리에서 DENIED = 아직 안 물어봄
    mockRequest.mockImplementation(async () => {
      calls.push('request');
      return RESULTS.GRANTED;
    });
    mockGather.mockImplementation(async () => {
      calls.push('gatherConsent');
      return {canRequestAds: true};
    });
    mockGetItem.mockResolvedValue(null);
    mockSetItem.mockResolvedValue(undefined);
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    setOS('ios');
  });

  it('iOS 에서 아직 안 물어봤으면 사전 안내 → ATT 요청 → UMP 순서로 돈다', async () => {
    await runConsentFlow(prePrompt);
    expect(calls).toEqual(['prePrompt', 'request', 'gatherConsent']);
    expect(isConsentFlowDone()).toBe(true);
  });

  it('iOS 에서 이미 정했으면 사전 안내 없이 UMP 만', async () => {
    mockCheck.mockResolvedValue(RESULTS.BLOCKED);
    await runConsentFlow(prePrompt);
    expect(prePrompt).not.toHaveBeenCalled();
    expect(mockRequest).not.toHaveBeenCalled();
    expect(calls).toEqual(['gatherConsent']);
  });

  it('Android 는 사전 안내·ATT 없이 UMP 만', async () => {
    setOS('android');
    await runConsentFlow(prePrompt);
    expect(prePrompt).not.toHaveBeenCalled();
    expect(mockCheck).not.toHaveBeenCalled();
    expect(mockRequest).not.toHaveBeenCalled();
    expect(calls).toEqual(['gatherConsent']);
  });

  it('gatherConsent 가 실패해도 흐름을 끝내고 완료로 남긴다', async () => {
    mockGather.mockRejectedValue(new Error('network'));
    await expect(runConsentFlow(prePrompt)).resolves.toBeUndefined();
    expect(isConsentFlowDone()).toBe(true);
    expect(mockSetItem).toHaveBeenCalledWith(CONSENT_FLOW_DONE_STORAGE_KEY, '1');
  });

  it('ATT 요청이 실패해도 throw 하지 않고 UMP 까지 간다', async () => {
    mockRequest.mockRejectedValue(new Error('native'));
    await expect(runConsentFlow(prePrompt)).resolves.toBeUndefined();
    expect(mockGather).toHaveBeenCalledTimes(1);
    expect(isConsentFlowDone()).toBe(true);
  });

  it('이미 끝났으면 다시 돌지 않는다', async () => {
    await runConsentFlow(prePrompt);
    await runConsentFlow(prePrompt);
    expect(prePrompt).toHaveBeenCalledTimes(1);
    expect(mockGather).toHaveBeenCalledTimes(1);
  });

  it('저장소에 완료로 남아 있으면 다시 돌지 않는다', async () => {
    mockGetItem.mockResolvedValue('1');
    await runConsentFlow(prePrompt);
    expect(prePrompt).not.toHaveBeenCalled();
    expect(mockGather).not.toHaveBeenCalled();
    expect(isConsentFlowDone()).toBe(true);
  });

  it('동시에 두 번 불러도 사전 안내는 한 번', async () => {
    const a = runConsentFlow(prePrompt);
    const b = runConsentFlow(prePrompt);
    expect(a).toBe(b);
    await Promise.all([a, b]);
    expect(prePrompt).toHaveBeenCalledTimes(1);
    expect(mockRequest).toHaveBeenCalledTimes(1);
    expect(mockGather).toHaveBeenCalledTimes(1);
  });

  it('완료되면 구독자에게 알린다', async () => {
    const listener = jest.fn();
    const unsubscribe = subscribeConsentFlowDone(listener);
    await runConsentFlow(prePrompt);
    expect(listener).toHaveBeenCalledWith(true);
    unsubscribe();
  });

  it('구독을 끊으면 알리지 않는다', async () => {
    const listener = jest.fn();
    subscribeConsentFlowDone(listener)();
    await runConsentFlow(prePrompt);
    expect(listener).not.toHaveBeenCalled();
  });

  describe('loadConsentFlowDone', () => {
    it('저장값이 1 이면 true 로 채우고 구독자에게 알린다', async () => {
      mockGetItem.mockResolvedValue('1');
      const listener = jest.fn();
      subscribeConsentFlowDone(listener);
      await expect(loadConsentFlowDone()).resolves.toBe(true);
      expect(mockGetItem).toHaveBeenCalledWith('ads-consent-flow-done');
      expect(isConsentFlowDone()).toBe(true);
      expect(listener).toHaveBeenCalledWith(true);
    });

    it('저장값이 없으면 false', async () => {
      await expect(loadConsentFlowDone()).resolves.toBe(false);
      expect(isConsentFlowDone()).toBe(false);
    });

    it('저장소 읽기가 실패해도 throw 하지 않는다', async () => {
      mockGetItem.mockRejectedValue(new Error('disk'));
      await expect(loadConsentFlowDone()).resolves.toBe(false);
    });
  });

  describe('getTrackingStatus / requestTracking', () => {
    it.each([
      [RESULTS.DENIED, 'not-determined'],
      [RESULTS.BLOCKED, 'denied'],
      [RESULTS.GRANTED, 'authorized'],
      [RESULTS.UNAVAILABLE, 'restricted'],
    ])('iOS 결과 %s 는 %s', async (result, expected) => {
      mockCheck.mockResolvedValue(result);
      await expect(getTrackingStatus()).resolves.toBe(expected);
    });

    it('Android 는 unavailable', async () => {
      setOS('android');
      await expect(getTrackingStatus()).resolves.toBe('unavailable');
      await expect(requestTracking(prePrompt)).resolves.toBe('unavailable');
      expect(mockCheck).not.toHaveBeenCalled();
    });

    it('check 가 실패하면 unavailable', async () => {
      mockCheck.mockRejectedValue(new Error('native'));
      await expect(getTrackingStatus()).resolves.toBe('unavailable');
    });

    it('아직 안 물어봤으면 사전 안내 뒤 요청하고 결과를 돌려준다', async () => {
      mockRequest.mockImplementation(async () => {
        calls.push('request');
        return RESULTS.BLOCKED;
      });
      await expect(requestTracking(prePrompt)).resolves.toBe('denied');
      expect(calls).toEqual(['prePrompt', 'request']);
    });

    it('이미 정했으면 묻지 않고 지금 상태를 돌려준다', async () => {
      mockCheck.mockResolvedValue(RESULTS.GRANTED);
      await expect(requestTracking(prePrompt)).resolves.toBe('authorized');
      expect(prePrompt).not.toHaveBeenCalled();
      expect(mockRequest).not.toHaveBeenCalled();
    });

    it('사전 안내가 실패하면 ATT 창을 띄우지 않고 throw 하지 않는다', async () => {
      prePrompt.mockRejectedValue(new Error('ui'));
      await expect(requestTracking(prePrompt)).resolves.toBe('unavailable');
      expect(mockRequest).not.toHaveBeenCalled();
    });
  });

  describe('canShowPrivacyOptions', () => {
    it('UMP 개인정보 옵션이 필요한 지역이면 true', async () => {
      mockConsentInfo.mockResolvedValue({privacyOptionsRequirementStatus: 'REQUIRED'});
      await expect(canShowPrivacyOptions()).resolves.toBe(true);
    });

    it('필요 없거나 실패하면 false', async () => {
      mockConsentInfo.mockResolvedValue({privacyOptionsRequirementStatus: 'NOT_REQUIRED'});
      await expect(canShowPrivacyOptions()).resolves.toBe(false);
      mockConsentInfo.mockRejectedValue(new Error('native'));
      await expect(canShowPrivacyOptions()).resolves.toBe(false);
    });
  });

  it('adRequestOptions: iOS 허용이면 맞춤, 거부면 비맞춤, Android 는 빈 옵션', async () => {
    mockCheck.mockResolvedValue(RESULTS.GRANTED);
    await expect(adRequestOptions()).resolves.toEqual({requestNonPersonalizedAdsOnly: false});
    mockCheck.mockResolvedValue(RESULTS.BLOCKED);
    await expect(adRequestOptions()).resolves.toEqual({requestNonPersonalizedAdsOnly: true});
    mockCheck.mockResolvedValue(RESULTS.DENIED);
    await expect(adRequestOptions()).resolves.toEqual({requestNonPersonalizedAdsOnly: true});
    setOS('android');
    await expect(adRequestOptions()).resolves.toEqual({});
  });
});
