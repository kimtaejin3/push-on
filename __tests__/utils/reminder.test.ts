import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  DEFAULT_REMINDER_SETTINGS,
  clampReminderSettings,
  loadReminderSettings,
  saveReminderSettings,
  nextTriggerTimestamp,
  MAX_REMINDER_DAYS,
} from '../../src/utils/reminder';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(), setItem: jest.fn(),
}));
const mockGet = AsyncStorage.getItem as jest.Mock;

describe('reminder settings', () => {
  beforeEach(() => jest.clearAllMocks());

  it('기본값: 꺼짐, 월·수·금 20:00', () => {
    expect(DEFAULT_REMINDER_SETTINGS).toEqual({enabled: false, days: [1, 3, 5], hour: 20, minute: 0});
  });

  it('범위 밖 값은 보정한다 (요일 0-6 중복 제거·정렬, 시 0-23, 분 0-59)', () => {
    expect(clampReminderSettings({enabled: true, days: [5, 1, 5, 9, -1], hour: 25, minute: 70}))
      .toEqual({enabled: true, days: [1, 5], hour: 23, minute: 59});
  });

  it('요일은 최대 3개까지만 남긴다 (주 3일 프로그램)', () => {
    expect(clampReminderSettings({enabled: true, days: [0, 1, 2, 3, 4], hour: 9, minute: 0}).days)
      .toEqual([0, 1, 2]);
    expect(MAX_REMINDER_DAYS).toBe(3);
  });

  it('저장된 값이 없거나 깨져 있으면 기본값', async () => {
    mockGet.mockResolvedValueOnce(null);
    await expect(loadReminderSettings()).resolves.toEqual(DEFAULT_REMINDER_SETTINGS);
    mockGet.mockResolvedValueOnce('broken');
    await expect(loadReminderSettings()).resolves.toEqual(DEFAULT_REMINDER_SETTINGS);
  });

  it('저장 시 보정을 거쳐 JSON 으로 저장한다', async () => {
    await saveReminderSettings({enabled: true, days: [3, 1], hour: 7, minute: 30});
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      'workout-reminder',
      JSON.stringify({enabled: true, days: [1, 3], hour: 7, minute: 30}),
    );
  });
});

describe('nextTriggerTimestamp', () => {
  // 2026-08-31 은 월요일
  const monday10am = new Date(2026, 7, 31, 10, 0, 0);

  it('같은 요일이고 아직 시각 전이면 오늘', () => {
    const ts = nextTriggerTimestamp(1, 20, 0, monday10am);
    expect(new Date(ts).getDay()).toBe(1);
    expect(new Date(ts).getDate()).toBe(31);
    expect(new Date(ts).getHours()).toBe(20);
  });

  it('같은 요일이지만 시각이 지났으면 다음 주', () => {
    const ts = nextTriggerTimestamp(1, 9, 0, monday10am);
    const d = new Date(ts);
    expect(d.getDay()).toBe(1);
    expect(d.getDate()).toBe(7); // 9/7 월요일
  });

  it('다른 요일이면 이번 주 해당 요일', () => {
    const ts = nextTriggerTimestamp(3, 20, 30, monday10am); // 수요일
    const d = new Date(ts);
    expect(d.getDay()).toBe(3);
    expect(d.getDate()).toBe(2); // 9/2 수요일
    expect(d.getMinutes()).toBe(30);
  });
});
