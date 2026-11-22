import mobileAds, {AdsConsent, MaxAdContentRating} from 'react-native-google-mobile-ads';
import {isConsentFlowDone} from './adsConsent';

// 앱 실행 중 한 번만 초기화한다. 여러 화면의 useAds 가 동시에 불러도 같은 프라미스를 기다린다
let initPromise: Promise<boolean> | null = null;
let ready = false;

/** 동의 흐름과 SDK 초기화가 끝나 광고를 요청해도 되는지 */
export const isAdsSdkReady = (): boolean => ready;

/**
 * AdMob SDK 를 초기화한다. 서버 설정에서 광고가 켜졌을 때만 부른다
 * (꺼져 있는 동안에는 SDK 를 깨우지 않는다).
 * 동의 흐름(adsConsent.runConsentFlow — ATT·UMP)이 끝나기 전에는 초기화하지 않고 false 를 돌려준다.
 * 이때는 결과를 기억하지 않아, 동의가 끝난 뒤 다시 부르면 초기화한다.
 * 어떤 실패도 밖으로 던지지 않고 false 를 돌려준다 → 광고 비노출, 앱은 정상 동작.
 */
const refreshConsentInfo = async () => {
  try {
    return await AdsConsent.requestInfoUpdate();
  } catch (error) {
    // 네트워크 등으로 갱신에 실패하면 문서 권장대로 저장된 동의 상태로 판단한다
    console.warn('[광고] 동의 정보 갱신 실패:', error);
    return AdsConsent.getConsentInfo();
  }
};

export const initializeAdsSdk = (): Promise<boolean> => {
  if (!isConsentFlowDone()) {
    return Promise.resolve(false);
  }
  if (!initPromise) {
    initPromise = (async () => {
      try {
        // UMP 양식은 동의 흐름에서 이미 돌았다. 여기서는 양식 없이 동의 정보만 새로 받는다.
        // 앱을 다시 켜면 UMP 상태가 UNKNOWN(canRequestAds false)이라, 구글 권장대로 실행마다 갱신해야 한다
        const {canRequestAds} = await refreshConsentInfo();
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
