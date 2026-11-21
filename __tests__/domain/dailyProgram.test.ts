import {PROGRAM} from '../../src/constants/hundredPushups';
import {buildDailyWeek, dailyDay} from '../../src/domain/dailyProgram';

const sum = (a: number[]) => a.reduce((x, y) => x + y, 0);
const LEVELS = [1, 2, 3] as const;

describe('buildDailyWeek (원본 3일 → 7일)', () => {
  it('1주차 레벨 2: 원본 Day 1·2·3 을 Day 1·4·7 에 놓고 사이를 나눈 뒤 60% 로 낮춘다', () => {
    expect(buildDailyWeek(PROGRAM[0], 2).map(d => d.sets)).toEqual([
      [4, 4, 2, 2, 3], [4, 4, 3, 3, 3], [4, 4, 3, 3, 4], [4, 5, 4, 4, 4],
      [4, 5, 4, 4, 5], [4, 6, 4, 4, 5], [5, 6, 4, 4, 6],
    ]);
  });
  it('세트 수가 다른 주(5주차): 가까운 쪽 모양을 쓰고 총 개수만 사이 값으로 맞춘다', () => {
    const week = buildDailyWeek(PROGRAM[4], 2);
    expect(week[0].sets).toEqual([17, 21, 15, 13, 21]);
    expect(week[1].sets).toEqual([17, 22, 16, 14, 22]);
    expect(week[2].sets).toEqual([10, 10, 12, 12, 8, 8, 9, 23]);
    expect(week[6].sets).toEqual([11, 11, 12, 12, 10, 10, 12, 27]);
  });
  it('휴식은 가까운 쪽 원본 Day 의 값', () => {
    expect(buildDailyWeek(PROGRAM[1], 1).map(d => d.rest)).toEqual([60, 60, 90, 90, 90, 120, 120]);
    expect(buildDailyWeek(PROGRAM[4], 1).map(d => d.rest)).toEqual([60, 60, 45, 45, 45, 45, 45]);
  });
  it('가장 적은 날도 세트마다 최소 1개 (1주차 레벨 1 Day 1)', () => {
    expect(buildDailyWeek(PROGRAM[0], 1)[0].sets).toEqual([1, 2, 1, 1, 2]);
  });
  it('전 주차·전 레벨: 7일이고, 주 안에서 하루 합계가 줄지 않고, 주간 총량은 원본의 1.3~1.45배', () => {
    PROGRAM.forEach(week =>
      LEVELS.forEach(level => {
        const days = buildDailyWeek(week, level);
        expect(days).toHaveLength(7);
        days.forEach((d, i) => {
          d.sets.forEach(n => expect(n).toBeGreaterThanOrEqual(1));
          if (i > 0) {
            expect(sum(d.sets)).toBeGreaterThanOrEqual(sum(days[i - 1].sets));
          }
        });
        const ratio = sum(days.map(d => sum(d.sets))) / sum(week.map(d => sum(d.sets[level - 1])));
        expect(ratio).toBeGreaterThan(1.3);
        expect(ratio).toBeLessThan(1.45);
      }),
    );
  });
});

describe('dailyDay', () => {
  it('주차·Day·레벨로 그날의 세트를 준다', () => {
    expect(dailyDay(3, 4, 2)).toEqual({rest: 90, sets: [8, 11, 8, 8, 11]});
    expect(dailyDay(6, 7, 3)).toEqual({rest: 45, sets: [16, 16, 20, 20, 16, 16, 13, 13, 36]});
  });
});
