import AsyncStorage from '@react-native-async-storage/async-storage';
import Purchases from 'react-native-purchases';
import RevenueCatUI from 'react-native-purchases-ui';
import {
  isProNow,
  presentProPaywall,
  resetPurchasesForTest,
  subscribePro,
  syncPurchasesUser,
} from '../../src/utils/purchases';

const info = (userId: string, pro: boolean) => ({
  originalAppUserId: userId,
  entitlements: {active: pro ? {pro: {identifier: 'pro'}} : {}},
});

const mockGetCustomerInfo = Purchases.getCustomerInfo as jest.Mock;
const mockLogIn = Purchases.logIn as jest.Mock;
const mockPaywall = RevenueCatUI.presentPaywallIfNeeded as jest.Mock;

beforeEach(async () => {
  jest.clearAllMocks();
  resetPurchasesForTest();
  await AsyncStorage.clear();
});

it('로그인하면 RevenueCat 을 그 계정으로 설정하고 Pro 를 반영·기억한다', async () => {
  mockGetCustomerInfo.mockResolvedValueOnce(info('u1', true));
  const seen: boolean[] = [];
  subscribePro(value => seen.push(value));

  await syncPurchasesUser('u1');

  expect(Purchases.configure).toHaveBeenCalledWith(expect.objectContaining({appUserID: 'u1'}));
  expect(isProNow()).toBe(true);
  expect(seen).toEqual([true]);
  expect(JSON.parse((await AsyncStorage.getItem('pro-status'))!)).toEqual({userId: 'u1', isPro: true});
});

it('확인에 실패하면 같은 계정의 기억한 값을 쓴다 (오프라인)', async () => {
  await AsyncStorage.setItem('pro-status', JSON.stringify({userId: 'u1', isPro: true}));
  mockGetCustomerInfo.mockRejectedValueOnce(new Error('offline'));
  jest.spyOn(console, 'warn').mockImplementation(() => {});

  await syncPurchasesUser('u1');

  expect(isProNow()).toBe(true);
});

it('다른 계정의 기억한 값은 쓰지 않고, 계정을 바꾸면 logIn 결과를 따른다', async () => {
  await AsyncStorage.setItem('pro-status', JSON.stringify({userId: 'u1', isPro: true}));
  mockGetCustomerInfo.mockResolvedValueOnce(info('u2', false));
  await syncPurchasesUser('u2');
  expect(isProNow()).toBe(false);

  mockLogIn.mockResolvedValueOnce({customerInfo: info('u1', true)});
  await syncPurchasesUser('u1');
  expect(Purchases.logIn).toHaveBeenCalledWith('u1');
  expect(isProNow()).toBe(true);
});

it('로그아웃하면 Pro 를 끈다', async () => {
  mockGetCustomerInfo.mockResolvedValueOnce(info('u1', true));
  await syncPurchasesUser('u1');
  await syncPurchasesUser(null);
  expect(isProNow()).toBe(false);
  expect(Purchases.logOut).toHaveBeenCalled();
});

it('결제 화면에서 구매하면 Pro 가 된다', async () => {
  mockGetCustomerInfo.mockResolvedValueOnce(info('u1', false));
  await syncPurchasesUser('u1');
  mockPaywall.mockResolvedValueOnce('PURCHASED');
  mockGetCustomerInfo.mockResolvedValueOnce(info('u1', true));

  await expect(presentProPaywall()).resolves.toBe('purchased');
  expect(mockPaywall).toHaveBeenCalledWith({requiredEntitlementIdentifier: 'pro'});
  expect(isProNow()).toBe(true);
});

it('취소하면 Pro 가 아니다', async () => {
  await syncPurchasesUser('u1');
  await expect(presentProPaywall()).resolves.toBe('cancelled');
  expect(isProNow()).toBe(false);
});
