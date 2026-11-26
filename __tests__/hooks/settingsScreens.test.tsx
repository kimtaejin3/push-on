import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {act, create, type ReactTestRenderer} from 'react-test-renderer';
import {Row} from '../../src/components/ui/Row';
import {Toggle} from '../../src/components/ui/Toggle';
import SettingScreen from '../../src/screens/SettingScreen';
import WorkoutReminderScreen, {
  reminderSettingsQuery,
} from '../../src/screens/WorkoutReminderScreen';
import {
  requestNotificationPermission,
  syncWorkoutReminders,
} from '../../src/services/workoutReminder';
import {queryKeys} from '../../src/tanstack-query/queryKeys';
import {DEFAULT_REMINDER_SETTINGS} from '../../src/utils/reminder';

jest.mock('../../src/components/ui/Icon', () => ({Icon: () => null}));
jest.mock('../../src/hooks/useSession', () => ({useSession: () => ({user: null})}));
jest.mock('../../src/remote/guest', () => ({isGuestUser: () => false}));
// 설정의 광고 섹션은 네이티브 광고 모듈이 필요하다 → 이 테스트에서는 서버 광고 꺼짐으로 둔다
jest.mock('../../src/hooks/useAds', () => ({
  useAds: () => ({serverAdsEnabled: false}),
}));
jest.mock('../../src/utils/adsConsent', () => ({
  canShowPrivacyOptions: jest.fn().mockResolvedValue(false),
  getTrackingStatus: jest.fn().mockResolvedValue('unavailable'),
  requestTracking: jest.fn(),
  showPrivacyOptions: jest.fn(),
}));
jest.mock('../../src/components/features/ads/AdExitFlowProvider', () => ({
  useTrackingPrePrompt: () => jest.fn(),
}));

const mockToast = jest.fn();
jest.mock('../../src/components/ui/feedback/ToastProvider', () => ({
  useToast: () => ({show: mockToast}),
}));
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({navigate: jest.fn(), goBack: jest.fn()}),
}));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: 'SafeAreaView',
  useSafeAreaInsets: () => ({top: 0, right: 0, bottom: 0, left: 0}),
}));
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));
jest.mock('@notifee/react-native', () => ({
  getNotificationSettings: jest.fn().mockResolvedValue({authorizationStatus: 1}),
  AuthorizationStatus: {AUTHORIZED: 1},
}));
jest.mock('../../src/services/workoutReminder', () => ({
  requestNotificationPermission: jest.fn(),
  syncWorkoutReminders: jest.fn(),
}));

let client: QueryClient;
let renderer: ReactTestRenderer;

async function render(screen: React.ReactElement) {
  await act(async () => {
    renderer = create(
      <QueryClientProvider client={client}>{screen}</QueryClientProvider>,
    );
  });
  return renderer.root;
}

beforeEach(() => {
  jest.clearAllMocks();
  // 미리 넣은 캐시를 마운트 때 다시 읽지 않게 한다. 다시 읽으면 AsyncStorage 목(빈 값)이 기본 설정으로 덮어써
  // 테스트가 부하에 따라 가끔 실패한다
  client = new QueryClient({defaultOptions: {queries: {staleTime: Infinity, retry: false}}});
  client.setQueryData(queryKeys.workoutPrefs, {autoNextSet: true});
  client.setQueryData(reminderSettingsQuery.queryKey, DEFAULT_REMINDER_SETTINGS);
});

afterEach(async () => {
  if (renderer) {
    await act(async () => renderer.unmount());
  }
  client.clear();
});

it('자동 진행을 저장하고 운동 화면과 같은 캐시를 갱신한다', async () => {
  const screen = await render(<SettingScreen />);

  await act(async () => screen.findByType(Toggle).props.onChange(false));

  expect(AsyncStorage.setItem).toHaveBeenCalledWith(
    'workout-prefs',
    JSON.stringify({autoNextSet: false}),
  );
  expect(client.getQueryData(queryKeys.workoutPrefs)).toEqual({autoNextSet: false});
});

it.each([
  [DEFAULT_REMINDER_SETTINGS, '꺼짐'],
  [{...DEFAULT_REMINDER_SETTINGS, enabled: true}, '매일 오후 8:00'],
  [{...DEFAULT_REMINDER_SETTINGS, enabled: true, days: [1, 3, 5]}, '월·수·금 오후 8:00'],
])('저장된 알림을 설정 요약에 표시한다', async (settings, summary) => {
  client.setQueryData(reminderSettingsQuery.queryKey, settings);
  const screen = await render(<SettingScreen />);

  expect(screen.findAllByType(Row).find(row => row.props.title === '운동 알림')?.props.value)
    .toBe(summary);
});

it('권한을 허용한 뒤에만 알림을 저장하고 다시 예약한다', async () => {
  const screen = await render(<WorkoutReminderScreen />);
  jest.mocked(requestNotificationPermission).mockResolvedValue(false);
  await act(async () => screen.findByType(Toggle).props.onChange(true));

  expect(screen.findByType(Toggle).props.disabled).toBe(true);
  expect(AsyncStorage.setItem).not.toHaveBeenCalled();
  expect(syncWorkoutReminders).not.toHaveBeenCalled();
});

it('마지막 요일을 유지하고 알림을 끄면 선택과 시간을 보존한 채 다시 예약한다', async () => {
  const enabled = {...DEFAULT_REMINDER_SETTINGS, enabled: true, days: [1]};
  client.setQueryData(reminderSettingsQuery.queryKey, enabled);
  const screen = await render(<WorkoutReminderScreen />);

  const monday = screen.findAll(node => node.props.accessibilityLabel === '월요일')[0];
  act(() => monday.props.onPress());
  expect(mockToast).toHaveBeenCalledWith('하루 이상은 골라야 해요');
  expect(AsyncStorage.setItem).not.toHaveBeenCalled();

  await act(async () => screen.findByType(Toggle).props.onChange(false));
  const disabled = {...enabled, enabled: false};
  expect(AsyncStorage.setItem).toHaveBeenCalledWith('workout-reminder', JSON.stringify(disabled));
  expect(syncWorkoutReminders).toHaveBeenCalledWith(disabled);
  expect(client.getQueryData(reminderSettingsQuery.queryKey)).toEqual(disabled);
});

it('권한을 받으면 알림을 켜서 저장하고 다시 예약한다', async () => {
  const screen = await render(<WorkoutReminderScreen />);
  jest.mocked(requestNotificationPermission).mockResolvedValue(true);
  await act(async () => screen.findByType(Toggle).props.onChange(true));

  const enabled = {...DEFAULT_REMINDER_SETTINGS, enabled: true};
  expect(AsyncStorage.setItem).toHaveBeenCalledWith('workout-reminder', JSON.stringify(enabled));
  expect(syncWorkoutReminders).toHaveBeenCalledWith(enabled);
  expect(client.getQueryData(reminderSettingsQuery.queryKey)).toEqual(enabled);
});
