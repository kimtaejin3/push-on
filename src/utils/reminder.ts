import AsyncStorage from '@react-native-async-storage/async-storage';

/** 100개 챌린지 운동 알림 설정. days 는 0(일)~6(토). */
export type ReminderSettings = {
  enabled: boolean;
  days: number[];
  hour: number;
  minute: number;
};

// 프로그램이 매일 하는 운동이라 기본값도 매일
export const DEFAULT_REMINDER_SETTINGS: ReminderSettings = {
  enabled: false,
  days: [0, 1, 2, 3, 4, 5, 6],
  hour: 20,
  minute: 0,
};

/** 매일 하는 프로그램이라 7일 모두 고를 수 있다 */
export const MAX_REMINDER_DAYS = 7;

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

export const clampReminderSettings = (s: ReminderSettings): ReminderSettings => ({
  enabled: !!s.enabled,
  days: [...new Set(s.days)]
    .filter(d => d >= 0 && d <= 6)
    .sort((a, b) => a - b)
    .slice(0, MAX_REMINDER_DAYS),
  hour: clamp(Math.trunc(s.hour), 0, 23),
  minute: clamp(Math.trunc(s.minute), 0, 59),
});

const STORAGE_KEY = 'workout-reminder';

export const loadReminderSettings = async (): Promise<ReminderSettings> => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return DEFAULT_REMINDER_SETTINGS;
    }
    const parsed = JSON.parse(raw);
    if (typeof parsed?.enabled !== 'boolean' || !Array.isArray(parsed?.days)) {
      return DEFAULT_REMINDER_SETTINGS;
    }
    return clampReminderSettings(parsed);
  } catch {
    return DEFAULT_REMINDER_SETTINGS;
  }
};

export const saveReminderSettings = async (s: ReminderSettings): Promise<void> => {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(clampReminderSettings(s)));
};

/** now 이후에 오는 "해당 요일의 hour:minute" 시각(ms). 이미 지났으면 다음 주. */
export const nextTriggerTimestamp = (
  day: number,
  hour: number,
  minute: number,
  now: Date = new Date(),
): number => {
  const candidate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute, 0, 0);
  const dayDiff = (day - now.getDay() + 7) % 7;
  candidate.setDate(candidate.getDate() + dayDiff);
  if (candidate <= now) {
    candidate.setDate(candidate.getDate() + 7);
  }
  return candidate.getTime();
};
