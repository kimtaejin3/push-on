import {Platform} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  AdsConsent,
  AdsConsentPrivacyOptionsRequirementStatus,
} from 'react-native-google-mobile-ads';
import {check, PERMISSIONS, PermissionStatus, request, RESULTS} from 'react-native-permissions';

/** iOS 앱 추적 허용(ATT) 상태. Android 등 ATT 가 없는 곳은 'unavailable' */
export type TrackingStatus =
  | 'unavailable'
  | 'not-determined'
  | 'denied'
  | 'authorized'
  | 'restricted';

export const CONSENT_FLOW_DONE_STORAGE_KEY = 'ads-consent-flow-done';

// 동의 흐름(ATT·UMP)을 한 번이라도 끝냈는지. 앱 시작 때 loadConsentFlowDone() 으로 채운다
let done = false;
let flowPromise: Promise<void> | null = null;
const listeners = new Set<(done: boolean) => void>();

const markDone = () => {
  if (done) {
    return;
  }
  done = true;
  listeners.forEach(listener => listener(true));
};

// react-native-permissions 는 ATT 상태를 일반 권한 결과로 바꿔 준다:
// 아직 안 물어봄 → DENIED(요청 가능), 거부 → BLOCKED, 허용 → GRANTED, 제한(자녀 보호 등) → UNAVAILABLE
const toTrackingStatus = (status: PermissionStatus): TrackingStatus => {
  switch (status) {
    case RESULTS.DENIED:
      return 'not-determined';
    case RESULTS.BLOCKED:
      return 'denied';
    case RESULTS.GRANTED:
      return 'authorized';
    case RESULTS.UNAVAILABLE:
      // 최소 지원 iOS(15.1)에는 ATT 가 항상 있으므로, 여기서는 기기 제한으로 본다
      return 'restricted';
    default:
      return 'denied';
  }
};

/** 지금 ATT 상태. iOS 만 확인하고, 실패하면 'unavailable' */
export const getTrackingStatus = async (): Promise<TrackingStatus> => {
  if (Platform.OS !== 'ios') {
    return 'unavailable';
  }
  try {
    return toTrackingStatus(await check(PERMISSIONS.IOS.APP_TRACKING_TRANSPARENCY));
  } catch (error) {
    console.warn('[광고] 추적 허용 상태 확인 실패:', error);
    return 'unavailable';
  }
};

/**
 * iOS 에서 아직 안 물어봤으면 사전 안내를 보여 준 뒤 시스템 ATT 창을 띄운다.
 * 이미 정했으면 묻지 않고 지금 상태를 돌려준다. Android 는 'unavailable'. 어떤 실패도 던지지 않는다.
 */
export const requestTracking = async (
  showPrePrompt: () => Promise<void>,
): Promise<TrackingStatus> => {
  if (Platform.OS !== 'ios') {
    return 'unavailable';
  }
  try {
    const status = await getTrackingStatus();
    if (status !== 'not-determined') {
      return status;
    }
    await showPrePrompt();
    return toTrackingStatus(await request(PERMISSIONS.IOS.APP_TRACKING_TRANSPARENCY));
  } catch (error) {
    console.warn('[광고] 추적 허용 요청 실패:', error);
    return 'unavailable';
  }
};

/** 동의 흐름을 끝냈는지(메모리 값). 끝나기 전에는 SDK 초기화도, 광고 요청도 하지 않는다 */
export const isConsentFlowDone = (): boolean => done;

/** 저장된 완료 여부를 읽어 메모리에 채운다. 완료로 바뀌면 구독자에게 알린다. 실패해도 던지지 않는다 */
export const loadConsentFlowDone = async (): Promise<boolean> => {
  try {
    if ((await AsyncStorage.getItem(CONSENT_FLOW_DONE_STORAGE_KEY)) === '1') {
      markDone();
    }
  } catch (error) {
    console.warn('[광고] 동의 흐름 완료 여부 읽기 실패:', error);
  }
  return done;
};

/** 동의 흐름 완료를 구독한다. 돌려받은 함수로 구독을 끊는다 */
export const subscribeConsentFlowDone = (listener: (done: boolean) => void): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

/**
 * 첫 결과 화면을 떠날 때 한 번 도는 동의 흐름.
 * iOS 이고 아직 안 물어봤으면 사전 안내 → ATT 창, 그다음 UMP(필요한 지역에서만 양식이 뜬다).
 * 끝나면 완료로 저장하고 구독자에게 알린다. 이미 끝났으면 아무것도 하지 않고,
 * 동시에 여러 번 불리면 같은 프라미스를 돌려준다. 어떤 실패도 던지지 않는다.
 */
export const runConsentFlow = (showPrePrompt: () => Promise<void>): Promise<void> => {
  if (done) {
    return Promise.resolve();
  }
  if (!flowPromise) {
    flowPromise = (async () => {
      try {
        // 앱 시작 때 읽기가 아직 안 끝났을 수 있어 저장값을 한 번 더 본다
        if (await loadConsentFlowDone()) {
          return;
        }
        await requestTracking(showPrePrompt);
        try {
          // EEA·영국 등 동의가 필요한 지역에서만 양식이 뜬다. 한국 사용자에게는 보이지 않는다
          await AdsConsent.gatherConsent();
        } catch (error) {
          // 문서 권장대로, 실패해도 이전 세션의 동의 상태로 요청 가능 여부를 판단한다(adsSdk)
          console.warn('[광고] 동의 확인 실패:', error);
        }
        try {
          await AsyncStorage.setItem(CONSENT_FLOW_DONE_STORAGE_KEY, '1');
        } catch (error) {
          console.warn('[광고] 동의 흐름 완료 저장 실패:', error);
        }
      } catch (error) {
        console.warn('[광고] 동의 흐름 실패:', error);
      }
      markDone();
    })();
  }
  return flowPromise;
};

/** UMP 개인정보 옵션(맞춤 광고 동의 변경)을 보여 줘야 하는 지역인지. 실패하면 false */
export const canShowPrivacyOptions = async (): Promise<boolean> => {
  try {
    const {privacyOptionsRequirementStatus} = await AdsConsent.getConsentInfo();
    return (
      privacyOptionsRequirementStatus === AdsConsentPrivacyOptionsRequirementStatus.REQUIRED
    );
  } catch (error) {
    console.warn('[광고] 개인정보 옵션 확인 실패:', error);
    return false;
  }
};

/** UMP 개인정보 옵션 양식을 띄운다. 실패해도 던지지 않는다 */
export const showPrivacyOptions = async (): Promise<void> => {
  try {
    await AdsConsent.showPrivacyOptionsForm();
  } catch (error) {
    console.warn('[광고] 개인정보 옵션 양식 실패:', error);
  }
};

/** 테스트 전용: 모듈 상태를 처음으로 되돌린다 */
export const resetAdsConsentForTest = () => {
  done = false;
  flowPromise = null;
  listeners.clear();
};
