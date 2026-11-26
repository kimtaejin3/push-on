import {addDays} from './streak';

/** 무료 사용자가 볼 수 있는 기록 기간 (오늘 포함) */
export const FREE_HISTORY_DAYS = 30;

/** 무료 사용자가 볼 수 있는 가장 오래된 날짜 (YYYY-MM-DD) */
export const freeHistoryFrom = (today: string): string =>
  addDays(today, -(FREE_HISTORY_DAYS - 1));

/** 그 날짜의 기록을 열어 볼 수 있는지 */
export const canViewDate = (isPro: boolean, date: string, today: string): boolean =>
  isPro || date >= freeHistoryFrom(today);

/** 그 달(첫날 YYYY-MM-01)로 넘겨 볼 수 있는지. 무료는 30일 범위가 걸친 달까지 */
export const canOpenMonth = (isPro: boolean, monthStart: string, today: string): boolean =>
  isPro || monthStart >= freeHistoryFrom(today).slice(0, 8) + '01';
