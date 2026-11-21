/* eslint-env jest */

// 네이티브 모듈이 없는 테스트 환경에서 import 만으로 터지지 않게, 라이브러리가 제공하는 목을 전역으로 건다.
// 파일마다 jest.mock 으로 다시 정의하면 그쪽이 우선한다.
jest.mock('react-native-permissions', () => require('react-native-permissions/mock'));
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
