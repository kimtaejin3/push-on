import {addDays, computeStreak} from '../../src/domain/streak';

const T = '2026-11-21';
const days = (start: string, n: number) => Array.from({length: n}, (_, i) => addDays(start, i));
const marks = (dates: string[], today = T) => computeStreak(dates, today).week.map(d => d.mark);

describe('addDays', () => {
  it('달·해를 넘겨 계산한다', () => {
    expect(addDays('2026-11-30', 1)).toBe('2026-12-01');
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31');
  });
});

describe('computeStreak', () => {
  it('기록이 없으면 0', () => {
    expect(computeStreak([], T)).toMatchObject({current: 0, todayDone: false, longest: 0, freezes: 0, lost: null, nextMilestone: 3});
  });
  it('오늘만 했으면 1일', () => {
    expect(computeStreak([T], T)).toMatchObject({current: 1, todayDone: true, longest: 1});
  });
  it('어제까지 12일 연속이고 오늘 아직이면 스트릭은 12로 살아 있다', () => {
    expect(computeStreak(days('2026-11-09', 12), T)).toMatchObject({current: 12, todayDone: false, freezes: 1, longest: 12, lost: null});
  });
  it('오늘까지 하면 13', () => {
    expect(computeStreak(days('2026-11-09', 13), T)).toMatchObject({current: 13, todayDone: true, freezes: 1});
  });
  it('7일째에 보호권 1개와 마일스톤', () => {
    expect(computeStreak(days('2026-11-15', 7), T)).toMatchObject({
      current: 7, freezes: 1, earnedFreezeToday: true, milestoneToday: 7, nextMilestone: 14,
    });
  });
  it('보호권은 최대 2개', () => {
    expect(computeStreak(days('2026-11-08', 14), T)).toMatchObject({current: 14, freezes: 2, earnedFreezeToday: true});
    expect(computeStreak(days('2026-11-01', 21), T)).toMatchObject({current: 21, freezes: 2, earnedFreezeToday: false});
  });
  it('하루 빠지면 보호권을 쓰고 스트릭은 유지된다 (보호된 날은 숫자에 안 들어간다)', () => {
    const dates = [...days('2026-11-10', 7), ...days('2026-11-18', 3)]; // 11-17 빠짐
    expect(computeStreak(dates, T)).toMatchObject({current: 10, freezes: 0, todayDone: false});
    expect(marks(dates)).toEqual(['done', 'frozen', 'done', 'done', 'done', 'today', 'future']);
  });
  it('어제 보호권이 쓰였으면 frozenYesterday', () => {
    expect(computeStreak(days('2026-11-13', 7), T)).toMatchObject({current: 7, freezes: 0, frozenYesterday: true, lost: null});
  });
  it('보호권 없이 어제 빠지면 끊기고, 끊기기 전 길이를 알려준다', () => {
    expect(computeStreak(days('2026-11-17', 3), T)).toMatchObject({current: 0, lost: 3, longest: 3});
  });
  it('끊긴 지 오래됐으면 lost 는 null', () => {
    expect(computeStreak(days('2026-11-10', 3), T)).toMatchObject({current: 0, lost: null, longest: 3});
  });
  it('보호권 2개면 이틀 연속 빠져도 유지되고 사흘째에 끊긴다', () => {
    const dates = days('2026-11-05', 14); // 11-18 까지
    expect(computeStreak(dates, T)).toMatchObject({current: 14, freezes: 0, frozenYesterday: true});
    expect(computeStreak(dates, '2026-11-22')).toMatchObject({current: 0, lost: 14, longest: 14});
  });
  it('끊긴 뒤 다시 시작하면 1부터, 최고 기록은 남는다', () => {
    expect(computeStreak([...days('2026-11-10', 3), '2026-11-20', T], T)).toMatchObject({current: 2, longest: 3, lost: null});
  });
  it('오늘보다 뒤의 날짜·중복·순서 뒤섞임은 무시한다', () => {
    expect(computeStreak([T, '2026-12-25', T], T)).toMatchObject({current: 1, todayDone: true});
    expect(computeStreak(['2026-11-20', '2026-11-19', T], T).current).toBe(3);
  });
  it('이번 주 7칸은 월요일부터', () => {
    const week = computeStreak([T], T).week;
    expect(week.map(d => d.date)).toEqual(days('2026-11-16', 7));
    expect(week.map(d => d.mark)).toEqual(['missed', 'missed', 'missed', 'missed', 'missed', 'done', 'future']);
  });
});
