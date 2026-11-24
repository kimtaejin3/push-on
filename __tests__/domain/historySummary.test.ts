import {
  monthSummary,
  monthSummaryLine,
  weeklyTotals,
  dailyBuckets,
} from '../../src/domain/historySummary';

const set = (date: string, reps: number) => ({
  id: date + reps,
  workout_date: date,
  reps,
  duration_seconds: 10,
  created_at: date + 'T10:00:00Z',
  mode: 'sets' as const,
  workout_id: null,
  set_index: null,
  target_reps: null,
});

it('월 요약과 문장', () => {
  const s = monthSummary(
    [set('2026-11-02', 10), set('2026-11-02', 12), set('2026-11-05', 16)],
    [set('2026-10-03', 8), set('2026-10-04', 10)],
  );
  expect(s).toEqual({
    total: 38,
    activeDays: 2,
    bestSet: 16,
    avgPerSet: 12.7,
    prevAvgPerSet: 9,
  });
  expect(monthSummaryLine(s)).toBe('지난달보다 세트당 평균 3.7개 늘었어요');
  expect(monthSummaryLine({...s, prevAvgPerSet: null})).toBe(
    '이번 달부터 기록이 쌓이고 있어요',
  );
  expect(monthSummaryLine(monthSummary([], []))).toBe(
    '이번 달 첫 운동을 기다리고 있어요',
  );
});

it('지난달보다 줄었거나 같은 경우의 요약 문장', () => {
  const current = [set('2026-11-02', 12), set('2026-11-02', 13)];
  const previous = [set('2026-10-03', 13)];
  expect(monthSummaryLine(monthSummary(current, previous))).toBe(
    '지난달보다 세트당 평균 0.5개 줄었어요',
  );
  expect(monthSummaryLine(monthSummary(current, current))).toBe(
    '지난달과 세트당 평균이 같아요',
  );
});

it('주간 총합 6주, 월요일 시작', () => {
  const w = weeklyTotals(
    [
      {date: '2026-11-16', totalReps: 50},
      {date: '2026-11-21', totalReps: 72},
      {date: '2026-10-12', totalReps: 30},
    ],
    '2026-11-21',
  );
  expect(w.map(x => x.weekStart)).toEqual([
    '2026-10-12',
    '2026-10-19',
    '2026-10-26',
    '2026-11-02',
    '2026-11-09',
    '2026-11-16',
  ]);
  expect(w.map(x => x.total)).toEqual([30, 0, 0, 0, 0, 122]);
});

it('일요일에 끝나는 주를 연도가 바뀌어도 같은 주로 집계한다', () => {
  expect(
    weeklyTotals(
      [
        {date: '2026-12-27', totalReps: 10},
        {date: '2026-12-28', totalReps: 20},
        {date: '2027-01-03', totalReps: 30},
        {date: '2027-01-04', totalReps: 40},
      ],
      '2027-01-03',
      1,
    ),
  ).toEqual([{weekStart: '2026-12-28', total: 50}]);
});

describe('dailyBuckets', () => {
  const row = (workout_date: string, reps: number, duration_seconds = 30) => ({
    workout_date,
    reps,
    duration_seconds,
  });

  it('오늘까지 N일을 빠짐없이 하루씩, 오래된 날부터 만든다', () => {
    const buckets = dailyBuckets([], 30, '2026-11-24');
    expect(buckets).toHaveLength(30);
    expect(buckets[0].date).toBe('2026-10-26');
    expect(buckets[29].date).toBe('2026-11-24');
    const dates = new Set(buckets.map(b => b.date));
    expect(dates.size).toBe(30);
  });

  it('달이 바뀌는 구간도 날짜가 끊기지 않는다', () => {
    const dates = dailyBuckets([], 7, '2026-03-02').map(b => b.date);
    expect(dates).toEqual([
      '2026-02-24', '2026-02-25', '2026-02-26', '2026-02-27',
      '2026-02-28', '2026-03-01', '2026-03-02',
    ]);
  });

  it('같은 날 세트를 합치고, 범위 밖 기록은 버린다', () => {
    const buckets = dailyBuckets(
      [row('2026-11-24', 20, 40), row('2026-11-24', 15, 30), row('2026-11-23', 10), row('2026-10-01', 99)],
      7,
      '2026-11-24',
    );
    const today = buckets[buckets.length - 1];
    expect(today).toEqual({date: '2026-11-24', totalReps: 35, totalSets: 2, totalDuration: 70});
    expect(buckets[buckets.length - 2].totalReps).toBe(10);
    expect(buckets.reduce((sum, b) => sum + b.totalReps, 0)).toBe(45);
  });
});
