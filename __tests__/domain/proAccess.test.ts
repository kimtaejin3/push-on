import {
  FREE_HISTORY_DAYS,
  canOpenMonth,
  canViewDate,
  freeHistoryFrom,
} from '../../src/domain/proAccess';

describe('무료 기록 열람 범위', () => {
  it('무료는 오늘을 포함해 최근 30일', () => {
    expect(FREE_HISTORY_DAYS).toBe(30);
    expect(freeHistoryFrom('2026-11-27')).toBe('2026-10-29');
  });

  it('무료는 30일 안의 날짜만, Pro 는 모든 날짜', () => {
    expect(canViewDate(false, '2026-10-29', '2026-11-27')).toBe(true);
    expect(canViewDate(false, '2026-10-28', '2026-11-27')).toBe(false);
    expect(canViewDate(true, '2025-01-01', '2026-11-27')).toBe(true);
  });

  it('무료는 30일 범위가 걸친 달까지만 넘겨 볼 수 있다', () => {
    // 2026-11-27 기준 범위 시작은 10월 29일 → 10월은 열리고 9월은 잠긴다
    expect(canOpenMonth(false, '2026-11-01', '2026-11-27')).toBe(true);
    expect(canOpenMonth(false, '2026-10-01', '2026-11-27')).toBe(true);
    expect(canOpenMonth(false, '2026-09-01', '2026-11-27')).toBe(false);
    expect(canOpenMonth(true, '2024-01-01', '2026-11-27')).toBe(true);
  });

  it('달 첫날이 범위 시작이면 앞 달은 잠긴다', () => {
    // 2026-11-30 기준 범위 시작은 11월 1일
    expect(freeHistoryFrom('2026-11-30')).toBe('2026-11-01');
    expect(canOpenMonth(false, '2026-10-01', '2026-11-30')).toBe(false);
  });
});
