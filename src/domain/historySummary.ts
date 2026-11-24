import type {PushupSetData} from '../remote/pushup';
import {addDays} from './streak';

export type MonthSummary = {
  total: number;
  activeDays: number;
  bestSet: number;
  avgPerSet: number;
  prevAvgPerSet: number | null;
};

const average = (total: number, count: number): number =>
  count === 0 ? 0 : Math.round((total * 10) / count) / 10;

export const monthSummary = (
  sets: PushupSetData[],
  prevSets: PushupSetData[],
): MonthSummary => {
  const dates = new Set<string>();
  let total = 0;
  let bestSet = 0;
  for (const set of sets) {
    total += set.reps;
    bestSet = Math.max(bestSet, set.reps);
    dates.add(set.workout_date);
  }
  const prevTotal = prevSets.reduce((sum, set) => sum + set.reps, 0);

  return {
    total,
    activeDays: dates.size,
    bestSet,
    avgPerSet: average(total, sets.length),
    prevAvgPerSet: prevSets.length === 0 ? null : average(prevTotal, prevSets.length),
  };
};

export const monthSummaryLine = (summary: MonthSummary): string => {
  const {activeDays, avgPerSet, prevAvgPerSet} = summary;
  if (activeDays === 0) {
    return '이번 달 첫 운동을 기다리고 있어요';
  }
  if (prevAvgPerSet === null) {
    return '이번 달부터 기록이 쌓이고 있어요';
  }
  if (avgPerSet === prevAvgPerSet) {
    return '지난달과 세트당 평균이 같아요';
  }
  const change = Math.abs(avgPerSet - prevAvgPerSet).toFixed(1);
  const direction = avgPerSet > prevAvgPerSet ? '늘었어요' : '줄었어요';
  return `지난달보다 세트당 평균 ${change}개 ${direction}`;
};

const mondayOf = (date: string): string => {
  const dayOfWeek = new Date(date).getUTCDay();
  return addDays(date, -((dayOfWeek + 6) % 7));
};

export const weeklyTotals = (
  days: {date: string; totalReps: number}[],
  today: string,
  weeks = 6,
): {weekStart: string; total: number}[] => {
  const currentMonday = mondayOf(today);
  const totals = new Map<string, number>();
  for (const {date, totalReps} of days) {
    const monday = mondayOf(date);
    totals.set(monday, (totals.get(monday) ?? 0) + totalReps);
  }

  return Array.from({length: weeks}, (_, index) => {
    const weekStart = addDays(currentMonday, (index - weeks + 1) * 7);
    return {weekStart, total: totals.get(weekStart) ?? 0};
  });
};

export type DailyBucket = {
  date: string; // YYYY-MM-DD (KST)
  totalReps: number;
  totalSets: number;
  totalDuration: number;
};

type SetRow = {workout_date: string; reps: number; duration_seconds: number};

/**
 * 오늘(KST)까지 days 일을 하루 한 칸씩, 오래된 날부터 채운다. 운동하지 않은 날은 0.
 * 기간별 통계의 주(7일)·월(30일) 막대에 쓴다.
 */
export const dailyBuckets = (rows: SetRow[], days: number, today: string): DailyBucket[] => {
  const buckets = new Map<string, DailyBucket>();
  for (let i = days - 1; i >= 0; i--) {
    const date = addDays(today, -i);
    buckets.set(date, {date, totalReps: 0, totalSets: 0, totalDuration: 0});
  }
  rows.forEach(row => {
    const bucket = buckets.get(row.workout_date);
    if (bucket) {
      bucket.totalReps += row.reps;
      bucket.totalSets += 1;
      bucket.totalDuration += row.duration_seconds;
    }
  });
  return [...buckets.values()];
};
