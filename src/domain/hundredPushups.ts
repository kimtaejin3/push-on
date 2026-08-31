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

/** 하루 목표 달성률: 실제 합 ÷ 목표 합 (마지막 max 세트는 최소치를 목표로 본다) */
export const dayAchievementRate = (planSets: number[], results: number[]): number => {
  const target = planSets.reduce((a, b) => a + b, 0);
  if (target === 0) {
    return 1;
  }
  const actual = results.reduce((a, b) => a + b, 0);
  return actual / target;
};

const REPEAT_SUGGEST_THRESHOLD = 0.8;

/** 목표의 80% 미만이면 "이 날 다시 하기"를 제안한다 (원본 프로그램의 '힘들면 반복' 권장) */
export const shouldSuggestRepeat = (planSets: number[], results: number[]): boolean =>
  dayAchievementRate(planSets, results) < REPEAT_SUGGEST_THRESHOLD;

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
