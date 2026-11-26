import AsyncStorage from '@react-native-async-storage/async-storage';
import Purchases, {type CustomerInfo} from 'react-native-purchases';
import RevenueCatUI, {PAYWALL_RESULT} from 'react-native-purchases-ui';
import {PRO_ENTITLEMENT, REVENUECAT_API_KEY} from '../constants/purchases';

/**
 * 평생 Pro 상태. RevenueCat 이 정답이고, 앱은 마지막으로 확인한 값을 폰에 기억해
 * 오프라인이나 확인 전에도 Pro 사용자에게 광고·잠금이 잠깐이라도 보이지 않게 한다.
 * 같은 로그인 계정이면 Android 에서 산 Pro 가 iOS 에서도 유지된다 (appUserID = Supabase user id).
 */

const STORAGE_KEY = 'pro-status';

type Stored = {userId: string; isPro: boolean};

let configured = false;
let currentUserId: string | null = null;
let isPro = false;
const listeners = new Set<(isPro: boolean) => void>();

const setPro = (next: boolean) => {
  if (next === isPro) {
    return;
  }
  isPro = next;
  listeners.forEach(listener => listener(next));
};

/** 지금 Pro 인지 (메모리 값). 훅 밖(광고 흐름 등)에서 쓴다 */
export const isProNow = (): boolean => isPro;

/** Pro 상태 변화를 구독한다. 돌려받은 함수로 끊는다 */
export const subscribePro = (listener: (isPro: boolean) => void): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const hasProEntitlement = (info: CustomerInfo): boolean =>
  info.entitlements.active[PRO_ENTITLEMENT] !== undefined;

const remember = (userId: string, value: boolean) => {
  const stored: Stored = {userId, isPro: value};
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(stored)).catch(error =>
    console.warn('[Pro] 상태 저장 실패:', error),
  );
};

const applyInfo = (info: CustomerInfo) => {
  // 로그아웃했거나 다른 계정으로 바뀌는 도중에 온 정보는 버린다
  if (!currentUserId || info.originalAppUserId !== currentUserId) {
    return;
  }
  const value = hasProEntitlement(info);
  remember(currentUserId, value);
  setPro(value);
};

/** 결제를 쓸 수 있는지 (키가 있고 SDK 를 설정했는지) */
export const isPurchasesAvailable = (): boolean => configured;

/**
 * 로그인 사용자를 RevenueCat 에 연결한다. 로그아웃이면 null.
 * 먼저 폰에 기억한 값으로 Pro 를 정하고, 서버 확인 결과로 바로잡는다. 어떤 실패도 던지지 않는다.
 */
export const syncPurchasesUser = async (userId: string | null): Promise<void> => {
  if (userId === currentUserId) {
    return;
  }
  currentUserId = userId;
  if (!userId) {
    setPro(false);
    if (configured) {
      Purchases.logOut().catch(() => {});
    }
    return;
  }
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const stored: Stored | null = raw ? JSON.parse(raw) : null;
    if (currentUserId === userId) {
      setPro(stored?.userId === userId && stored.isPro);
    }
  } catch (error) {
    console.warn('[Pro] 기억한 상태 읽기 실패:', error);
  }
  if (!REVENUECAT_API_KEY) {
    return;
  }
  try {
    if (!configured) {
      Purchases.configure({apiKey: REVENUECAT_API_KEY, appUserID: userId});
      Purchases.addCustomerInfoUpdateListener(applyInfo);
      configured = true;
      applyInfo(await Purchases.getCustomerInfo());
    } else {
      const {customerInfo} = await Purchases.logIn(userId);
      applyInfo(customerInfo);
    }
  } catch (error) {
    // 오프라인 등: 기억한 값을 그대로 쓴다
    console.warn('[Pro] 상태 확인 실패:', error);
  }
};

export type PaywallOutcome = 'purchased' | 'restored' | 'cancelled' | 'error' | 'unavailable';

/** 결제 화면(RevenueCat Paywall)을 띄운다. 이미 Pro 면 띄우지 않는다 */
export const presentProPaywall = async (): Promise<PaywallOutcome> => {
  if (!configured) {
    return 'unavailable';
  }
  try {
    const result = await RevenueCatUI.presentPaywallIfNeeded({
      requiredEntitlementIdentifier: PRO_ENTITLEMENT,
    });
    switch (result) {
      case PAYWALL_RESULT.PURCHASED:
      case PAYWALL_RESULT.RESTORED:
        applyInfo(await Purchases.getCustomerInfo());
        return result === PAYWALL_RESULT.PURCHASED ? 'purchased' : 'restored';
      case PAYWALL_RESULT.NOT_PRESENTED:
        // 이미 Pro
        return 'restored';
      case PAYWALL_RESULT.CANCELLED:
        return 'cancelled';
      default:
        return 'error';
    }
  } catch (error) {
    console.warn('[Pro] 결제 화면 실패:', error);
    return 'error';
  }
};

/** 구매 복원. Pro 가 되면 true */
export const restorePro = async (): Promise<boolean> => {
  if (!configured) {
    return false;
  }
  const info = await Purchases.restorePurchases();
  applyInfo(info);
  return hasProEntitlement(info);
};

/** 테스트 전용 */
export const resetPurchasesForTest = () => {
  configured = false;
  currentUserId = null;
  isPro = false;
  listeners.clear();
};
