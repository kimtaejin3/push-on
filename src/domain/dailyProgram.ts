import {
  PROGRAM,
  DAYS_PER_WEEK,
  DAILY_VOLUME_RATIO,
  type ProgramDay,
} from '../constants/hundredPushups';

/** 주 7일 표의 하루. sets 의 마지막 원소는 "최소 N개, 가능한 만큼" */
export type DailyDay = {rest: number; sets: number[]};

const sum = (a: number[]) => a.reduce((x, y) => x + y, 0);

/**
 * 원본 한 주(Day 1·2·3)를 주 7일로 펼친다.
 * 원본 Day 1·2·3 을 Day 1·4·7 에 놓고 사이 날은 앞뒤 값을 나눠 채운 뒤, 매일 하므로 ratio 만큼 낮춘다.
 * 앞뒤 세트 수가 다르면(5·6주차) 가까운 쪽 모양을 쓰고 총 개수만 사이 값으로 맞춘다.
 * 휴식은 가까운 쪽 원본 Day 의 값. 어느 세트도 1개 아래로 내려가지 않는다.
 */
export const buildDailyWeek = (
  week: ProgramDay[],
  level: 1 | 2 | 3,
  ratio = DAILY_VOLUME_RATIO,
): DailyDay[] => {
  const anchors = week.map(d => ({rest: d.rest, sets: d.sets[level - 1]})); // 원본 Day 1·2·3
  return Array.from({length: DAYS_PER_WEEK}, (_, index) => {
    const t = index / 3; // Day 1→0, Day 4→1, Day 7→2
    const i = Math.min(Math.floor(t), 1);
    const frac = t - i;
    const a = anchors[i];
    const b = anchors[i + 1];
    const near = frac < 0.5 ? a : b;
    const raw =
      a.sets.length === b.sets.length
        ? a.sets.map((n, k) => n + frac * (b.sets[k] - n))
        : near.sets.map(n => (n * (sum(a.sets) + frac * (sum(b.sets) - sum(a.sets)))) / sum(near.sets));
    return {rest: near.rest, sets: raw.map(n => Math.max(1, Math.round(n * ratio)))};
  });
};

/** DAILY[week-1][level-1][day-1]. 표는 바뀌지 않으므로 모듈에서 한 번만 계산한다 */
const DAILY: DailyDay[][][] = PROGRAM.map(week =>
  ([1, 2, 3] as const).map(level => buildDailyWeek(week, level)),
);

/** 주차(1..6)·Day(1..7)·레벨의 그날 세트와 휴식 */
export const dailyDay = (week: number, day: number, level: 1 | 2 | 3): DailyDay =>
  DAILY[week - 1][level - 1][day - 1];
