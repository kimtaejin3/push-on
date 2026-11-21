import AsyncStorage from '@react-native-async-storage/async-storage';
import {DEFAULT_STREAK_REMINDER, type StreakReminderSettings} from '../domain/streakNotifications';

// 100개 챌린지 운동 알림('workout-reminder')과 독립이라 키도 따로 둔다
const REMINDER_KEY = 'streak-reminder';
const LAST_CELEBRATED_KEY = 'streak-last-celebrated';
const REMINDER_OFFERED_KEY = 'streak-reminder-offered';

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

const clampStreakReminder = (s: StreakReminderSettings): StreakReminderSettings => ({
  enabled: !!s.enabled,
  hour: clamp(Math.trunc(s.hour), 0, 23),
  minute: clamp(Math.trunc(s.minute), 0, 59),
});

/** 저장된 값이 없거나 깨져 있으면 기본값(꺼짐, 21:00) */
export const loadStreakReminder = async (): Promise<StreakReminderSettings> => {
  try {
    const raw = await AsyncStorage.getItem(REMINDER_KEY);
    if (!raw) {
      return DEFAULT_STREAK_REMINDER;
    }
    const parsed = JSON.parse(raw);
    if (
      typeof parsed?.enabled !== 'boolean' ||
      !Number.isFinite(parsed?.hour) ||
      !Number.isFinite(parsed?.minute)
    ) {
      return DEFAULT_STREAK_REMINDER;
    }
    return clampStreakReminder(parsed);
  } catch {
    return DEFAULT_STREAK_REMINDER;
  }
};

export const saveStreakReminder = async (s: StreakReminderSettings): Promise<void> => {
  await AsyncStorage.setItem(REMINDER_KEY, JSON.stringify(clampStreakReminder(s)));
};

/** 축하 화면을 마지막으로 보여 준 날짜('YYYY-MM-DD'). 하루에 한 번만 보여 주려고 둔다 */
export const loadLastCelebrated = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(LAST_CELEBRATED_KEY);
  } catch {
    return null;
  }
};

export const saveLastCelebrated = async (date: string): Promise<void> => {
  await AsyncStorage.setItem(LAST_CELEBRATED_KEY, date);
};

/** 축하 화면에서 "스트릭 알림 받기"를 이미 권했는지. 한 번만 권하고 다시 조르지 않으려고 둔다 */
export const loadReminderOffered = async (): Promise<boolean> => {
  try {
    return (await AsyncStorage.getItem(REMINDER_OFFERED_KEY)) === 'true';
  } catch {
    return false;
  }
};

export const saveReminderOffered = async (): Promise<void> => {
  await AsyncStorage.setItem(REMINDER_OFFERED_KEY, 'true');
};
