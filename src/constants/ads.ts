import {Platform} from 'react-native';
import {RequestOptions, TestIds} from 'react-native-google-mobile-ads';
import {getTrackingStatus} from '../utils/adsConsent';

// 개발 빌드에서는 실제 광고 단위를 부르면 무효 트래픽으로 계정이 제재될 수 있어 항상 테스트 ID 를 쓴다
export const BANNER_AD_UNIT_ID: string = __DEV__
  ? TestIds.BANNER
  : Platform.select({
      ios: 'ca-app-pub-5759779417992194/8924962776',
      default: 'ca-app-pub-5759779417992194/5672113479',
    });

export const INTERSTITIAL_AD_UNIT_ID: string = __DEV__
  ? TestIds.INTERSTITIAL
  : Platform.select({
      ios: 'ca-app-pub-5759779417992194/2359554422',
      default: 'ca-app-pub-5759779417992194/9360077044',
    });

// 네이티브 고급 광고 단위. 배치별 수익을 따로 보려고 홈·결과·리더보드를 나눴다. 이미지·동영상 모두 허용
export const NATIVE_HOME_AD_UNIT_ID: string = __DEV__
  ? TestIds.NATIVE_VIDEO
  : Platform.select({
      ios: 'ca-app-pub-5759779417992194/5997427432',
      default: 'ca-app-pub-5759779417992194/1263975507',
    });

export const NATIVE_RESULT_AD_UNIT_ID: string = __DEV__
  ? TestIds.NATIVE_VIDEO
  : Platform.select({
      ios: 'ca-app-pub-5759779417992194/5902505772',
      default: 'ca-app-pub-5759779417992194/3698567152',
    });

export const NATIVE_LEADERBOARD_AD_UNIT_ID: string = __DEV__
  ? TestIds.NATIVE_VIDEO
  : Platform.select({
      ios: 'ca-app-pub-5759779417992194/9689260432',
      default: 'ca-app-pub-5759779417992194/1678908479',
    });

/**
 * 광고 요청 옵션. iOS 는 앱 추적을 허용했을 때만 맞춤 광고, 아니면 비맞춤만 요청한다.
 * Android 등은 빈 옵션 — UMP·TCF 동의 결과를 SDK 가 그대로 따른다.
 */
export const adRequestOptions = async (): Promise<RequestOptions> => {
  if (Platform.OS === 'ios') {
    return {requestNonPersonalizedAdsOnly: (await getTrackingStatus()) !== 'authorized'};
  }
  return {};
};

/**
 * @deprecated adRequestOptions() 로 바뀐다(useAds 작업에서 쓰는 곳을 옮기고 지운다).
 * 옮기기 전까지는 예전처럼 모든 광고 요청을 비개인화로 보낸다.
 */
export const AD_REQUEST_OPTIONS = {requestNonPersonalizedAdsOnly: true} as const;
