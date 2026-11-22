import {Platform} from 'react-native';
import {AdsConsent} from 'react-native-google-mobile-ads';
import {initializeAdsSdk, isAdsSdkReady, resetAdsSdkForTest} from '../../src/utils/adsSdk';
import {resetAdsConsentForTest, runConsentFlow} from '../../src/utils/adsConsent';

const mockInitialize = jest.fn(() => Promise.resolve([]));
const mockSetRequestConfiguration = jest.fn(() => Promise.resolve());

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
}));
jest.mock('react-native-google-mobile-ads', () => ({
  __esModule: true,
  default: () => ({
    initialize: mockInitialize,
    setRequestConfiguration: mockSetRequestConfiguration,
  }),
  AdsConsent: {
    gatherConsent: jest.fn(() => Promise.resolve({canRequestAds: true})),
    getConsentInfo: jest.fn(() => Promise.resolve({canRequestAds: true})),
    requestInfoUpdate: jest.fn(() => Promise.resolve({canRequestAds: true})),
  },
  MaxAdContentRating: {T: 'T'},
}));

describe('adsSdk', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetAdsSdkForTest();
    resetAdsConsentForTest();
    jest.replaceProperty(Platform, 'OS', 'android');
  });

  afterEach(() => jest.restoreAllMocks());

  it('동의 흐름 전에는 초기화하지 않고, 끝난 뒤 부르면 초기화한다', async () => {
    await expect(initializeAdsSdk()).resolves.toBe(false);
    expect(mockInitialize).not.toHaveBeenCalled();
    expect(isAdsSdkReady()).toBe(false);

    await runConsentFlow(async () => {});

    await expect(initializeAdsSdk()).resolves.toBe(true);
    expect(mockSetRequestConfiguration).toHaveBeenCalledWith({maxAdContentRating: 'T'});
    expect(mockInitialize).toHaveBeenCalledTimes(1);
    expect(isAdsSdkReady()).toBe(true);
  });

  it('초기화에서는 동의 양식을 띄우지 않는다(동의 흐름이 맡는다)', async () => {
    await runConsentFlow(async () => {});
    (AdsConsent.gatherConsent as jest.Mock).mockClear();
    await initializeAdsSdk();
    expect(AdsConsent.gatherConsent).not.toHaveBeenCalled();
  });

  it('광고 요청이 허용되지 않으면 초기화하지 않는다', async () => {
    await runConsentFlow(async () => {});
    (AdsConsent.requestInfoUpdate as jest.Mock).mockResolvedValueOnce({canRequestAds: false});
    await expect(initializeAdsSdk()).resolves.toBe(false);
    expect(mockInitialize).not.toHaveBeenCalled();
  });

  it('동시에 여러 번 불러도 초기화는 한 번', async () => {
    await runConsentFlow(async () => {});
    await Promise.all([initializeAdsSdk(), initializeAdsSdk()]);
    expect(mockInitialize).toHaveBeenCalledTimes(1);
  });

  it('앱을 다시 켜면 동의 정보를 새로 받아 판단한다 (저장된 상태가 UNKNOWN 이어도)', async () => {
    await runConsentFlow(async () => {});
    (AdsConsent.getConsentInfo as jest.Mock).mockResolvedValue({canRequestAds: false, status: 'UNKNOWN'});
    await expect(initializeAdsSdk()).resolves.toBe(true);
    expect(AdsConsent.requestInfoUpdate).toHaveBeenCalledTimes(1);
  });

  it('동의 정보 갱신이 실패하면 저장된 상태로 판단한다', async () => {
    await runConsentFlow(async () => {});
    (AdsConsent.requestInfoUpdate as jest.Mock).mockRejectedValueOnce(new Error('offline'));
    (AdsConsent.getConsentInfo as jest.Mock).mockResolvedValueOnce({canRequestAds: true});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    await expect(initializeAdsSdk()).resolves.toBe(true);
  });
});
