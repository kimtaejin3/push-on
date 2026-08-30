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
