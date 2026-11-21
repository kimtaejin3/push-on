import {PROGRAM, WEEKS, DAYS_PER_WEEK} from '../constants/hundredPushups';

export type Level = 1 | 2 | 3;

export type ProgramState = {
  week: number; // 1..6
  day: number; // 1..3
  level: Level;
  lastTestReps: number;
  testDue: boolean; // 다음 행동이 최대 횟수 테스트인지
  status: 'active' | 'completed';
};

/** 주차별 열 경계. [열1 최소, 열2 최소, 열3 최소] — 열1 최소 미만이면 그 주차 진입 불가(null) */
const THRESHOLDS: Record<number, [number, number, number]> = {
  1: [0, 6, 11],
  2: [0, 6, 11],
  3: [16, 21, 26],
  4: [16, 21, 26],
  5: [31, 36, 41],
  6: [46, 51, 61],
};

/** 테스트 결과로 해당 주차의 열을 정한다. 최소 미달이면 null. */
export const assignLevel = (week: number, testReps: number): Level | null => {
  const [min1, min2, min3] = THRESHOLDS[week];
  if (testReps < min1) {
    return null;
  }
  if (testReps >= min3) {
    return 3;
  }
  if (testReps >= min2) {
    return 2;
  }
  return 1;
};

/** 끝나면 최대 횟수 테스트가 있는 주차 */
const TEST_WEEKS = new Set([2, 4, 5, 6]);
const FINAL_GOAL = 100;

export const startProgram = (testReps: number): ProgramState => {
  // 원본: 20개 초과면 1·2주차를 건너뛰고 3주차부터
  const week = testReps > 20 ? 3 : 1;
  return {
    week,
    day: 1,
    level: assignLevel(week, testReps) ?? 1,
    lastTestReps: testReps,
    testDue: false,
    status: 'active',
  };
};

export const todayPlan = (state: ProgramState) => {
  const day = PROGRAM[state.week - 1][state.day - 1];
  return {
    sets: day.sets[state.level - 1],
    restSeconds: day.rest,
    lastIsMax: true as const,
  };
};

export const completeDay = (state: ProgramState): ProgramState => {
  if (state.day < DAYS_PER_WEEK) {
    return {...state, day: state.day + 1};
  }
  if (TEST_WEEKS.has(state.week)) {
    return {...state, testDue: true};
  }
  return {...state, week: Math.min(state.week + 1, WEEKS), day: 1};
};

export const applyTest = (state: ProgramState, reps: number): ProgramState => {
  if (!state.testDue) {
    return state;
  }
  const base = {...state, lastTestReps: reps, testDue: false, day: 1};

  if (state.week === WEEKS) {
    if (reps >= FINAL_GOAL) {
      return {...base, status: 'completed'};
    }
    return {...base, week: WEEKS, level: assignLevel(WEEKS, reps) ?? 1};
  }

  const nextWeek = state.week + 1;
  const nextLevel = assignLevel(nextWeek, reps);
  if (nextLevel !== null) {
    return {...base, week: nextWeek, level: nextLevel};
  }
  // 다음 주차 최소 미달 → 이번 주차 반복 (열은 이번 주차 기준으로 재배정)
  return {...base, week: state.week, level: assignLevel(state.week, reps) ?? 1};
};

export const describeSets = (sets: number[], lastIsMax: boolean): string =>
  sets
    .map((n, i) => (lastIsMax && i === sets.length - 1 ? `${n}+` : `${n}`))
    .join(' · ');

/**
 * 레벨 다시 재기: 진행 중인 주차 안에서 열만 다시 배정한다 (주차/일차 유지).
 * 첫 테스트를 컨디션 나쁜 날 재서 너무 쉬운 열로 시작한 경우를 위한 장치.
 */
export const retestLevel = (state: ProgramState, reps: number): ProgramState => {
  if (state.testDue || state.status !== 'active') {
    return state;
  }
  return {...state, level: assignLevel(state.week, reps) ?? 1, lastTestReps: reps};
};

export type InitialTestPreviewRow = {
  range: string;
  week: number;
  level: Level;
  sets: string;
  restSeconds: number;
};

/** 초기 테스트 결과 구간별 대표값 (열 경계 기준) */
const PREVIEW_SAMPLES: {range: string; reps: number}[] = [
  {range: '5개 이하', reps: 5},
  {range: '6 ~ 10개', reps: 8},
  {range: '11 ~ 20개', reps: 15},
  {range: '21개 이상', reps: 30},
];

/** 초기 테스트 결과에 따라 첫 운동이 어떻게 정해지는지 미리 보여준다 (실제 표에서 계산) */
export const initialTestPreview = (): InitialTestPreviewRow[] =>
  PREVIEW_SAMPLES.map(({range, reps}) => {
    const state = startProgram(reps);
    const plan = todayPlan(state);
    return {
      range,
      week: state.week,
      level: state.level,
      sets: describeSets(plan.sets, plan.lastIsMax),
      restSeconds: plan.restSeconds,
    };
  });

export type ProgramTableDay = {day: number; sets: string; restSeconds: number};
export type ProgramTableWeek = {week: number; hasTest: boolean; days: ProgramTableDay[]};

/** 특정 레벨의 6주 × 3일 전체 세트 구성 */
export const programTable = (level: Level): ProgramTableWeek[] =>
  PROGRAM.map((week, weekIndex) => ({
    week: weekIndex + 1,
    hasTest: TEST_WEEKS.has(weekIndex + 1),
    days: week.map((day, dayIndex) => ({
      day: dayIndex + 1,
      sets: describeSets(day.sets[level - 1], true),
      restSeconds: day.rest,
    })),
  }));

/**
 * completed_days 에 쌓이는 기록. 시도(통과/실패) 또는 이동 표시.
 * 구버전 앱이 남긴 기록에는 level/targets/passed 가 없다 — passed 가 없으면 통과로 본다.
 */
export type ProgramRecord = {
  week: number;
  day: number;
  reps: number[];
  completed_at: string;
  level?: Level;
  targets?: number[];
  passed?: boolean;
  /** 하향·주차 변경 표시. 시도가 아니다 */
  kind?: 'move';
};

export type Position = {week: number; day: number; level: Level};

/** 못 채운 세트. set 은 1부터 */
export type MissedSet = {set: number; reps: number; target: number; short: number};

/** 같은 위치를 이만큼 연속으로 실패하면 하향을 권한다 */
export const DOWNGRADE_AFTER = 2;

/** 못 채운 세트만 돌려준다. 결과가 짧으면 빠진 세트는 0개로 본다 */
export const missedSets = (targets: number[], reps: number[]): MissedSet[] =>
  targets
    .map((target, i) => ({set: i + 1, reps: reps[i] ?? 0, target, short: target - (reps[i] ?? 0)}))
    .filter(s => s.short > 0);

/** 모든 세트가 목표 이상이어야 통과 (마지막 max 세트는 최소치가 목표) */
export const isDayPassed = (targets: number[], reps: number[]): boolean =>
  missedSets(targets, reps).length === 0;

export const attemptRecord = (
  state: ProgramState,
  targets: number[],
  reps: number[],
  at: string,
): ProgramRecord => ({
  week: state.week,
  day: state.day,
  level: state.level,
  targets,
  reps,
  passed: isDayPassed(targets, reps),
  completed_at: at,
});

/** 하향·주차 변경 표시. 이동한 "뒤"의 상태를 받는다 */
export const moveRecord = (state: ProgramState, at: string): ProgramRecord => ({
  kind: 'move',
  week: state.week,
  day: state.day,
  level: state.level,
  reps: [],
  completed_at: at,
});

const isFailureAt = (record: ProgramRecord, state: ProgramState): boolean =>
  record.kind !== 'move' &&
  record.passed === false &&
  record.week === state.week &&
  record.day === state.day &&
  record.level === state.level;

/** 현재 위치(주차·Day·레벨)의 실패가 기록 끝에서부터 이어진 개수 */
export const failStreak = (records: ProgramRecord[], state: ProgramState): number => {
  let count = 0;
  for (let i = records.length - 1; i >= 0 && isFailureAt(records[i], state); i--) {
    count++;
  }
  return count;
};

/** 마지막 기록이 현재 위치의 실패일 때만 그 기록 */
export const lastFailure = (records: ProgramRecord[], state: ProgramState): ProgramRecord | null => {
  const last = records[records.length - 1];
  return last && isFailureAt(last, state) ? last : null;
};

/** 통과한 운동 일수 (예전 기록 포함, 실패·이동 표시 제외) */
export const passedDayCount = (records: ProgramRecord[]): number =>
  records.filter(r => r.kind !== 'move' && r.passed !== false).length;

/**
 * 하향 대상. 레벨 2·3 은 같은 주차·Day 의 한 레벨 아래,
 * 레벨 1 은 이전 주차 Day 1 레벨 1 (이전 주차의 높은 레벨은 오히려 더 어렵다).
 * 1주차 레벨 1 은 더 낮출 곳이 없다.
 */
export const downgradeTarget = (state: ProgramState): Position | null => {
  if (state.level > 1) {
    return {week: state.week, day: state.day, level: (state.level - 1) as Level};
  }
  if (state.week > 1) {
    return {week: state.week - 1, day: 1, level: 1};
  }
  return null;
};

/** 하향·주차 직접 고르기 공용: 위치를 옮기고 테스트 차례를 푼다. 최근 테스트 기록은 유지 */
export const moveTo = (state: ProgramState, to: Position): ProgramState => {
  if (state.status !== 'active') {
    return state;
  }
  return {...state, week: to.week, day: to.day, level: to.level, testDue: false};
};

/** 그 주차·레벨이 기준으로 삼는 최대 횟수 범위. max 가 null 이면 "min 이상" */
export const levelRange = (week: number, level: Level): {min: number; max: number | null} => {
  const mins: number[] = THRESHOLDS[week];
  const min = mins[level - 1];
  if (level < 3) {
    return {min, max: mins[level] - 1};
  }
  // 1·2주차는 20개 초과면 3주차로 건너뛰므로 레벨 3 의 상한이 20
  return {min, max: week <= 2 ? 20 : null};
};

/** 그 주차 끝 테스트의 통과 기준. 테스트가 없는 주차는 null */
export const testThreshold = (week: number): number | null => {
  if (!TEST_WEEKS.has(week)) {
    return null;
  }
  return week === WEEKS ? FINAL_GOAL : THRESHOLDS[week + 1][0];
};

/** 테스트 결과가 무엇을 뜻하는지 (결과 화면 안내용) */
export type TestOutcome =
  | {kind: 'start'; week: number; level: Level}
  | {kind: 'advance'; week: number; level: Level}
  | {kind: 'repeat'; week: number; level: Level; prevLevel: Level; threshold: number; short: number}
  | {kind: 'finalMiss'; level: Level; prevLevel: Level; short: number}
  | {kind: 'completed'}
  | {kind: 'retest'; week: number; level: Level; prevLevel: Level};

/**
 * 최대 횟수 테스트 결과를 프로그램에 반영한 다음 상태와, 그 의미.
 * 프로그램이 없거나 완료 상태면 새로 시작, 테스트 차례면 주차 테스트, 아니면 레벨 다시 재기.
 */
export const resolveTest = (
  state: ProgramState | null,
  reps: number,
): {next: ProgramState; outcome: TestOutcome} => {
  if (!state || state.status === 'completed') {
    const next = startProgram(reps);
    return {next, outcome: {kind: 'start', week: next.week, level: next.level}};
  }
  if (!state.testDue) {
    const next = retestLevel(state, reps);
    return {next, outcome: {kind: 'retest', week: next.week, level: next.level, prevLevel: state.level}};
  }
  const next = applyTest(state, reps);
  if (next.status === 'completed') {
    return {next, outcome: {kind: 'completed'}};
  }
  if (state.week === WEEKS) {
    return {
      next,
      outcome: {kind: 'finalMiss', level: next.level, prevLevel: state.level, short: FINAL_GOAL - reps},
    };
  }
  if (next.week > state.week) {
    return {next, outcome: {kind: 'advance', week: next.week, level: next.level}};
  }
  const threshold = testThreshold(state.week) ?? 0;
  return {
    next,
    outcome: {
      kind: 'repeat',
      week: next.week,
      level: next.level,
      prevLevel: state.level,
      threshold,
      short: threshold - reps,
    },
  };
};

/** 그 위치(주차·Day·레벨)의 세트 구성 문자열. 하향·주차 변경 안내에서 "바꾸면 이렇게 돼요"를 보여줄 때 쓴다 */
export const describeSetsAt = (to: Position): string =>
  describeSets(PROGRAM[to.week - 1][to.day - 1].sets[to.level - 1], true);
