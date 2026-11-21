import mobileAds, {AdsConsent, MaxAdContentRating} from 'react-native-google-mobile-ads';

// 앱 실행 중 한 번만 초기화한다. 여러 화면의 useAds 가 동시에 불러도 같은 프라미스를 기다린다
let initPromise: Promise<boolean> | null = null;
let ready = false;

/** 동의 확인과 SDK 초기화가 끝나 광고를 요청해도 되는지 */
export const isAdsSdkReady = (): boolean => ready;

/**
 * UMP 동의를 확인하고 AdMob SDK 를 초기화한다. 서버 설정에서 광고가 켜졌을 때만 부른다
 * (꺼져 있는 동안에는 SDK 를 깨우지도, 동의를 묻지도 않는다).
 * 어떤 실패도 밖으로 던지지 않고 false 를 돌려준다 → 광고 비노출, 앱은 정상 동작.
 */
export const initializeAdsSdk = (): Promise<boolean> => {
  if (!initPromise) {
    initPromise = (async () => {
      try {
        try {
          // EEA 등 동의가 필요한 지역에서만 폼이 뜬다. 한국 사용자에게는 표시되지 않는다
          await AdsConsent.gatherConsent();
        } catch (error) {
          // 문서 권장대로, 실패해도 이전 세션의 동의 상태로 요청 가능 여부를 판단한다
          console.warn('[광고] 동의 확인 실패:', error);
        }
        const {canRequestAds} = await AdsConsent.getConsentInfo();
        if (!canRequestAds) {
          return false;
        }
        // 요청 설정은 initialize 전에 해야 이후 모든 요청(사전 로드 포함)에 적용된다
        await mobileAds().setRequestConfiguration({
          maxAdContentRating: MaxAdContentRating.T,
        });
        await mobileAds().initialize();
        ready = true;
        return true;
      } catch (error) {
        console.warn('[광고] SDK 초기화 실패:', error);
        return false;
      }
    })();
  }
  return initPromise;
};

/** 테스트 전용: 모듈 상태를 처음으로 되돌린다 */
export const resetAdsSdkForTest = () => {
  initPromise = null;
  ready = false;
};
