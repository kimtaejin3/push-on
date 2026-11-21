import {addDays} from '../../src/domain/streak';
import {
  planStreakNotifications,
  STREAK_NOTIFICATION_IDS,
  type StreakNotification,
} from '../../src/domain/streakNotifications';

const on = {enabled: true, hour: 21, minute: 0};
const at = (day: number, h: number, m: number) => new Date(2026, 10, day, h, m, 0, 0).getTime();
const days = (start: string, n: number) => Array.from({length: n}, (_, i) => addDays(start, i));
const brief = (list: StreakNotification[]) => list.map(n => [n.id, n.kind, n.at]);

describe('planStreakNotifications', () => {
  it('꺼져 있으면 아무것도 걸지 않는다', () => {
    expect(planStreakNotifications(days('2026-11-09', 12), '2026-11-21', new Date(2026, 10, 21, 10), {...on, enabled: false})).toEqual([]);
  });
  it('오늘 아직 안 했으면: 오늘 위험(보호권 있음) → 내일 "어제 보호권 사용" → 모레 "끊김"', () => {
    const plan = planStreakNotifications(days('2026-11-09', 12), '2026-11-21', new Date(2026, 10, 21, 10), on);
    expect(brief(plan)).toEqual([
      ['streak-0-evening', 'riskWithFreeze', at(21, 21, 0)],
      ['streak-0-last', 'lastCall', at(21, 22, 30)],
      ['streak-1-evening', 'frozen', at(22, 21, 0)],
      ['streak-1-last', 'lastCall', at(22, 22, 30)],
      ['streak-2-evening', 'lost', at(23, 21, 0)],
    ]);
  });
  it('이미 지난 시각의 알림은 걸지 않는다', () => {
    const plan = planStreakNotifications(days('2026-11-09', 12), '2026-11-21', new Date(2026, 10, 21, 21, 30), on);
    expect(plan[0].id).toBe('streak-0-last');
  });
  it('오늘 했으면 내일부터 3일 치', () => {
    const plan = planStreakNotifications(days('2026-11-09', 13), '2026-11-21', new Date(2026, 10, 21, 10), on);
    expect(brief(plan)).toEqual([
      ['streak-0-evening', 'riskWithFreeze', at(22, 21, 0)],
      ['streak-0-last', 'lastCall', at(22, 22, 30)],
      ['streak-1-evening', 'frozen', at(23, 21, 0)],
      ['streak-1-last', 'lastCall', at(23, 22, 30)],
      ['streak-2-evening', 'lost', at(24, 21, 0)],
    ]);
  });
  it('보호권이 없으면 risk, 스트릭 3 미만이면 마지막 알림이 없다', () => {
    const plan = planStreakNotifications(days('2026-11-19', 2), '2026-11-21', new Date(2026, 10, 21, 10), on);
    expect(brief(plan)).toEqual([
      ['streak-0-evening', 'risk', at(21, 21, 0)],
      ['streak-1-evening', 'lost', at(22, 21, 0)],
    ]);
  });
  it('지킬 스트릭이 없으면 보내지 않는다 (그만둔 사람에게 계속 보내지 않는다)', () => {
    expect(planStreakNotifications(days('2026-11-01', 3), '2026-11-21', new Date(2026, 10, 21, 10), on)).toEqual([]);
    expect(planStreakNotifications([], '2026-11-21', new Date(2026, 10, 21, 10), on)).toEqual([]);
  });
  it('제목·본문에 스트릭 길이가 들어간다', () => {
    const [first] = planStreakNotifications(days('2026-11-09', 12), '2026-11-21', new Date(2026, 10, 21, 10), on);
    expect(`${first.title} ${first.body}`).toContain('12일');
  });
  it('모든 종류의 알림 문구에 스트릭 길이가 들어가고, id 는 미리 정한 6개 안에 있다', () => {
    const plan = planStreakNotifications(days('2026-11-09', 12), '2026-11-21', new Date(2026, 10, 21, 10), on);
    for (const n of plan) {
      expect(`${n.title} ${n.body}`).toContain('12일');
      expect(STREAK_NOTIFICATION_IDS).toContain(n.id);
    }
    expect(STREAK_NOTIFICATION_IDS).toHaveLength(6);
  });
});
