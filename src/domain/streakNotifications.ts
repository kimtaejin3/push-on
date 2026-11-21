import {addDays, computeStreak, type StreakState} from './streak';

export type StreakReminderSettings = {enabled: boolean; hour: number; minute: number};
/** 권한은 사용자가 켤 때만 요청하므로 기본은 꺼짐 */
export const DEFAULT_STREAK_REMINDER: StreakReminderSettings = {enabled: false, hour: 21, minute: 0};
/** 마지막 알림은 시각을 고정한다 */
export const LAST_CALL = {hour: 22, minute: 30};
/** 이보다 짧은 스트릭에는 마지막 알림까지 보내지 않는다 */
export const LAST_CALL_MIN_STREAK = 3;

export type StreakNotificationKind = 'risk' | 'riskWithFreeze' | 'frozen' | 'lost' | 'lastCall';
export type StreakNotification = {id: string; at: number; kind: StreakNotificationKind; title: string; body: string};

/** 앱을 안 여는 동안 미리 걸어 두는 날 수. 이보다 길게 안 오면 더 보내지 않는다 */
const PLAN_DAYS = 3;

const eveningId = (i: number) => `streak-${i}-evening`;
const lastId = (i: number) => `streak-${i}-last`;

/** 다시 걸기 전에 지울 수 있도록 쓸 수 있는 id 전부 */
export const STREAK_NOTIFICATION_IDS: string[] = Array.from({length: PLAN_DAYS}, (_, i) => [
  eveningId(i),
  lastId(i),
]).flat();

const eveningKind = (state: StreakState): StreakNotificationKind | null => {
  if (state.lost !== null) {
    return 'lost';
  }
  if (state.frozenYesterday) {
    return 'frozen';
  }
  if (state.current >= 1) {
    return state.freezes > 0 ? 'riskWithFreeze' : 'risk';
  }
  return null; // 지킬 스트릭도, 방금 끊긴 스트릭도 없다
};

/** 알림 문구 (스펙 5장). 어느 알림이든 스트릭 길이를 넣어 무엇을 지키는지 보이게 한다 */
const copy = (kind: StreakNotificationKind, state: StreakState): {title: string; body: string} => {
  const n = state.current;
  switch (kind) {
    case 'risk':
      return {title: `🔥 ${n}일 스트릭이 오늘 끝나요`, body: '푸쉬업 1개만 해도 이어져요'};
    case 'riskWithFreeze':
      return {title: `🔥 ${n}일 스트릭을 이어가요`, body: '오늘 안 하면 보호권을 써요. 푸쉬업 1개만 해도 이어져요'};
    case 'frozen':
      return {title: `🔥 어제는 보호권이 ${n}일 스트릭을 지켜줬어요`, body: '오늘은 직접 이어가요. 푸쉬업 1개만 해도 돼요'};
    case 'lost':
      return {title: `${state.lost}일 스트릭이 끊겼어요`, body: `최고 기록 ${state.longest}일 · 오늘 다시 시작해요`};
    case 'lastCall':
      return {title: '🔥 자정까지 얼마 안 남았어요', body: `${n}일 스트릭을 지켜요. 푸쉬업 1개면 이어져요`};
  }
};

/** 'YYYY-MM-DD' 의 기기 로컬 시각 */
const localTime = (date: string, hour: number, minute: number): number => {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(y, m - 1, d, hour, minute, 0, 0).getTime();
};

/** today 는 now 의 기기 날짜(YYYY-MM-DD). 이후 계속 운동하지 않는다고 가정하고 앞으로 3일 치를 계획한다. */
export const planStreakNotifications = (
  dates: string[],
  today: string,
  now: Date,
  settings: StreakReminderSettings,
): StreakNotification[] => {
  if (!settings.enabled) {
    return [];
  }
  // 오늘 이미 했으면 오늘 치는 필요 없으니 내일부터
  const start = computeStreak(dates, today).todayDone ? addDays(today, 1) : today;
  const plan: StreakNotification[] = [];
  for (let i = 0; i < PLAN_DAYS; i++) {
    const date = addDays(start, i);
    const state = computeStreak(dates, date); // 그날 아침의 상태 (그 사이 운동 안 했다고 가정)
    const kind = eveningKind(state);
    if (kind !== null) {
      plan.push({id: eveningId(i), at: localTime(date, settings.hour, settings.minute), kind, ...copy(kind, state)});
    }
    if (state.current >= LAST_CALL_MIN_STREAK) {
      plan.push({id: lastId(i), at: localTime(date, LAST_CALL.hour, LAST_CALL.minute), kind: 'lastCall', ...copy('lastCall', state)});
    }
  }
  return plan.filter(n => n.at > now.getTime());
};
