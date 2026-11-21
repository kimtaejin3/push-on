import {Platform} from 'react-native';
import {TestIds} from 'react-native-google-mobile-ads';

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

// ATT 팝업 없이 심사를 통과하기 위해 모든 광고 요청을 비개인화로 보낸다
export const AD_REQUEST_OPTIONS = {requestNonPersonalizedAdsOnly: true} as const;
