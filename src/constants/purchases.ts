import {Platform} from 'react-native';

/** RevenueCat 권한(entitlement) — 평생 Pro */
export const PRO_ENTITLEMENT = 'pro';

/** 평생 Pro 가격 표시 (결제 화면 밖의 안내 문구에서만 쓴다. 실제 가격은 스토어가 정한다) */
export const PRO_PRICE_LABEL = '1,900원';

// RevenueCat 공개 SDK 키. 공개 키라 코드에 둬도 된다(비밀 키와 다르다).
// 개발 빌드는 Test Store 키로 실제 결제 없이 흐름을 확인한다.
const TEST_STORE_KEY = 'test_CagnwesMSddqUlgUJwAbzsDaYrz';
// 스토어 앱을 RevenueCat 에 연결하면 받는 키. 비어 있으면 결제를 끈 채로 앱이 동작한다
const IOS_KEY = 'appl_gLRZhOFIKTLLjEmNiBkvEvQHqiA';
const ANDROID_KEY = 'goog_KiPRlojGFKETJUqisiVLRRLZgYa';

export const REVENUECAT_API_KEY: string = __DEV__
  ? TEST_STORE_KEY
  : Platform.select({ios: IOS_KEY, android: ANDROID_KEY, default: ''});
