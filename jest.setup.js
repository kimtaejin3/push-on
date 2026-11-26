/* eslint-env jest */

// 네이티브 모듈이 없는 테스트 환경에서 import 만으로 터지지 않게, 라이브러리가 제공하는 목을 전역으로 건다.
// 파일마다 jest.mock 으로 다시 정의하면 그쪽이 우선한다.
jest.mock('react-native-permissions', () => require('react-native-permissions/mock'));
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
// 결제(RevenueCat)는 네이티브 모듈이라 테스트에서는 기본 목을 쓴다. 필요한 테스트는 다시 정의한다
jest.mock('react-native-purchases', () => ({
  __esModule: true,
  default: {
    configure: jest.fn(),
    addCustomerInfoUpdateListener: jest.fn(),
    getCustomerInfo: jest.fn(() =>
      Promise.resolve({originalAppUserId: '', entitlements: {active: {}}}),
    ),
    logIn: jest.fn(() =>
      Promise.resolve({customerInfo: {originalAppUserId: '', entitlements: {active: {}}}}),
    ),
    logOut: jest.fn(() => Promise.resolve({})),
    restorePurchases: jest.fn(() =>
      Promise.resolve({originalAppUserId: '', entitlements: {active: {}}}),
    ),
  },
}));
jest.mock('react-native-purchases-ui', () => ({
  __esModule: true,
  default: {presentPaywallIfNeeded: jest.fn(() => Promise.resolve('CANCELLED'))},
  PAYWALL_RESULT: {
    NOT_PRESENTED: 'NOT_PRESENTED',
    ERROR: 'ERROR',
    CANCELLED: 'CANCELLED',
    PURCHASED: 'PURCHASED',
    RESTORED: 'RESTORED',
  },
}));
