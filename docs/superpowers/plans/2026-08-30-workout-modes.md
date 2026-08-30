# 운동 모드 3종 (챌린지 / 세트 / 100개 만들기) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 메인 화면을 3개 모드 카드로 바꾸고, 기존 ARKit 카운팅 엔진 위에 세트 모드와 hundredpushups.com 6주 프로그램(100개 만들기)을 얹는다.

**Architecture:** `usePushUpManager`(네이티브 카운팅)는 건드리지 않는다. 그 위에 순수 리듀서 `workoutSession`(idle→tracking→rest→done)과 공용 `WorkoutScreen` 을 만들고, 세트 모드는 사용자가 고른 구성으로, 100개 모드는 순수 모듈 `domain/hundredPushups` 가 계산한 "오늘의 세트"로 같은 화면을 호출한다. 챌린지 화면은 100개 모드의 테스트로 재사용한다.

**Tech Stack:** React Native 0.79 (Hermes), TypeScript, @tanstack/react-query v5, Supabase (PostgREST), react-navigation 7 static API, jest + react-test-renderer.

**Spec:** `docs/superpowers/specs/2026-08-30-workout-modes-design.md`

## Global Constraints

- 디자인: Material 느낌, 최대한 심플. 카드·버튼에 아이콘·장식 문구 없음. 색은 `src/constants/colors.ts` 만 사용 (`backgroundDark`, `overlayLight`, `overlayMedium`, `primary`, `textLight`, `textSecondary`, `gray400`).
- 100개 프로그램 표·휴식·반복 규칙은 스펙 부록 A / 4절 그대로. 임의 변경 금지.
- DB 변경은 전부 기본값/nullable (구버전 앱 호환). SQL 은 사용자가 Supabase SQL Editor 에서 직접 실행한다.
- 테스트는 `jest.mock('../../src/lib/supabase', factory)` 로 supabase 를 목한다 (자동 목은 ESM `react-native-url-polyfill` 을 끌고 와 실패함). 훅 테스트도 의존 모듈은 팩토리 목.
- 검증 명령: `npx jest __tests__/<path>`, `npx tsc --noEmit -p tsconfig.json`, `npx eslint src __tests__`. `__tests__/App.test.tsx` 는 기존부터 깨져 있으므로(navigation ESM) 전체 `npx jest` 는 쓰지 않는다.
- 커밋 메시지는 한국어, `feat:`/`test:`/`chore:` 접두, 본문 끝에 `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.

---

## File Structure

| 파일 | 책임 |
|---|---|
| `src/constants/hundredPushups.ts` | 6주 프로그램 표 (데이터만) |
| `src/domain/hundredPushups.ts` | 열 배정·진행·테스트 규칙 (순수 함수) |
| `src/domain/workoutSession.ts` | 세트 운동 상태기계 (순수 리듀서) |
| `src/hooks/useWorkoutSession.ts` | 리듀서 + 휴식 카운트다운 interval |
| `src/utils/id.ts` | `generateUuid()` |
| `src/utils/setsPreset.ts` | 세트 모드 프리셋·범위 보정·마지막 설정 저장 |
| `src/remote/pushup.ts` | `savePushupSession` 에 mode/workout_id/set_index/target_reps 추가 |
| `src/remote/program.ts` | `pushup_programs` CRUD + row↔state 변환 |
| `src/tanstack-query/queryKeys.ts`, `queryOptions/program.ts`, `mutationHooks/program.ts`, `index.ts` | 프로그램 쿼리/뮤테이션 |
| `src/components/features/home/ModeCard.tsx` | 홈 카드 (텍스트만) |
| `src/components/features/workout/WorkoutHeader.tsx` | "세트 2 / 5 · 목표 10" |
| `src/components/features/workout/RestTimer.tsx` | 휴식 카운트다운 + 건너뛰기 |
| `src/components/features/workout/WorkoutSummary.tsx` | 세트별 결과표 |
| `src/screens/HomeScreen.tsx` | 3카드 |
| `src/screens/SetsSetupScreen.tsx` | 프리셋/커스텀 → Workout |
| `src/screens/WorkoutScreen.tsx` | 세트/프로그램 공용 운동 화면 |
| `src/screens/ProgramScreen.tsx` | 100개 만들기 상태별 화면 |
| `src/screens/ChallengeScreen.tsx`, `components/features/push-up/ChallengeResult.tsx` | `purpose='program-test'` 지원 |
| `src/components/features/push-up/SetCard.tsx` | `target_reps` 있으면 "12 / 10" |
| `src/navigations/AppNavigation.tsx` | 라우트 3개 추가 + 파라미터 타입 |
| `WORKOUT_MODES.sql` | 사용자가 실행할 DB 변경 |

---

### Task 1: 프로그램 표 + 규칙 (domain/hundredPushups)

**Files:**
- Create: `src/constants/hundredPushups.ts`
- Create: `src/domain/hundredPushups.ts`
- Test: `__tests__/domain/hundredPushups.test.ts`

**Interfaces:**
- Produces:
  - `type Level = 1 | 2 | 3`
  - `type ProgramState = {week: number; day: number; level: Level; lastTestReps: number; testDue: boolean; status: 'active' | 'completed'}`
  - `assignLevel(week: number, testReps: number): Level | null` — null = 그 주차 최소 미달
  - `startProgram(testReps: number): ProgramState`
  - `todayPlan(state: ProgramState): {sets: number[]; restSeconds: number; lastIsMax: true}`
  - `completeDay(state: ProgramState): ProgramState`
  - `applyTest(state: ProgramState, reps: number): ProgramState`
  - `describeSets(sets: number[], lastIsMax: boolean): string` — `"6 · 6 · 4 · 4 · 5+"`

- [ ] **Step 1: 실패하는 테스트 작성**

```ts
// __tests__/domain/hundredPushups.test.ts
import {
  assignLevel, startProgram, todayPlan, completeDay, applyTest, describeSets,
} from '../../src/domain/hundredPushups';
import {PROGRAM} from '../../src/constants/hundredPushups';

describe('PROGRAM 표', () => {
  it('6주 × 3일이고 모든 날의 세트가 열 3개를 가진다', () => {
    expect(PROGRAM).toHaveLength(6);
    PROGRAM.forEach(week => {
      expect(week).toHaveLength(3);
      week.forEach(day => {
        expect(day.sets).toHaveLength(3);
        const len = day.sets[0].length;
        day.sets.forEach(col => expect(col).toHaveLength(len));
        expect(day.rest).toBeGreaterThan(0);
      });
    });
  });
  it('원본 표의 몇 칸을 그대로 담고 있다', () => {
    expect(PROGRAM[0][0].sets).toEqual([[2,3,2,2,3],[6,6,4,4,5],[10,12,7,7,9]]);
    expect(PROGRAM[1][2].rest).toBe(120);
    expect(PROGRAM[4][1].sets[2]).toEqual([19,19,22,22,18,18,22,45]);
    expect(PROGRAM[5][2].sets[0]).toHaveLength(9);
  });
});

describe('assignLevel', () => {
  it.each([
    [1, 0, 1], [1, 5, 1], [1, 6, 2], [1, 10, 2], [1, 11, 3], [1, 20, 3],
    [3, 15, null], [3, 16, 1], [3, 20, 1], [3, 21, 2], [3, 25, 2], [3, 26, 3],
    [4, 26, 3],
    [5, 30, null], [5, 31, 1], [5, 35, 1], [5, 36, 2], [5, 40, 2], [5, 41, 3],
    [6, 45, null], [6, 46, 1], [6, 50, 1], [6, 51, 2], [6, 60, 2], [6, 61, 3],
  ])('week %i, %i회 → %s', (week, reps, expected) => {
    expect(assignLevel(week, reps)).toBe(expected);
  });
});

describe('startProgram', () => {
  it('초기 테스트 8회면 1주차 열 2', () => {
    expect(startProgram(8)).toEqual({week: 1, day: 1, level: 2, lastTestReps: 8, testDue: false, status: 'active'});
  });
  it('20회 초과면 3주차에서 시작한다', () => {
    expect(startProgram(23)).toMatchObject({week: 3, day: 1, level: 2});
    expect(startProgram(40)).toMatchObject({week: 3, day: 1, level: 3});
  });
});

describe('todayPlan', () => {
  it('주차/일차/열에 맞는 세트와 휴식을 준다', () => {
    const plan = todayPlan({week: 2, day: 3, level: 1, lastTestReps: 4, testDue: false, status: 'active'});
    expect(plan).toEqual({sets: [5,7,5,5,8], restSeconds: 120, lastIsMax: true});
  });
});

describe('completeDay', () => {
  const base = {level: 1 as const, lastTestReps: 4, testDue: false, status: 'active' as const};
  it('Day 1 → Day 2', () => {
    expect(completeDay({...base, week: 1, day: 1})).toMatchObject({week: 1, day: 2, testDue: false});
  });
  it('테스트 없는 주(1,3)의 Day 3 → 다음 주 Day 1', () => {
    expect(completeDay({...base, week: 1, day: 3})).toMatchObject({week: 2, day: 1, testDue: false});
    expect(completeDay({...base, week: 3, day: 3})).toMatchObject({week: 4, day: 1, testDue: false});
  });
  it('테스트 있는 주(2,4,5,6)의 Day 3 → testDue', () => {
    [2, 4, 5, 6].forEach(week => {
      expect(completeDay({...base, week, day: 3})).toMatchObject({week, day: 3, testDue: true});
    });
  });
});

describe('applyTest', () => {
  const due = (week: number, level: 1 | 2 | 3 = 1) =>
    ({week, day: 3, level, lastTestReps: 0, testDue: true, status: 'active' as const});
  it('2주차 테스트 22회 → 3주차 열 2', () => {
    expect(applyTest(due(2), 22)).toMatchObject({week: 3, day: 1, level: 2, testDue: false, lastTestReps: 22});
  });
  it('2주차 테스트 12회(16 미만) → 2주차 반복, 열은 2주차 기준으로 재배정', () => {
    expect(applyTest(due(2), 12)).toMatchObject({week: 2, day: 1, level: 3, testDue: false});
  });
  it('4주차 테스트 38회 → 5주차 열 2 / 25회 → 4주차 반복 열 2', () => {
    expect(applyTest(due(4), 38)).toMatchObject({week: 5, day: 1, level: 2});
    expect(applyTest(due(4), 25)).toMatchObject({week: 4, day: 1, level: 2});
  });
  it('5주차 테스트 47회 → 6주차 열 1 / 40회 → 5주차 반복 열 2', () => {
    expect(applyTest(due(5), 47)).toMatchObject({week: 6, day: 1, level: 1});
    expect(applyTest(due(5), 40)).toMatchObject({week: 5, day: 1, level: 2});
  });
  it('6주차 최종 테스트 100회 이상 → completed, 미만 → 6주차 반복', () => {
    expect(applyTest(due(6), 100)).toMatchObject({status: 'completed', testDue: false});
    expect(applyTest(due(6), 70)).toMatchObject({week: 6, day: 1, level: 3, status: 'active'});
  });
  it('testDue 가 아니면 그대로 돌려준다', () => {
    const s = {week: 1, day: 2, level: 1 as const, lastTestReps: 3, testDue: false, status: 'active' as const};
    expect(applyTest(s, 50)).toBe(s);
  });
});

describe('describeSets', () => {
  it('가운뎃점으로 잇고 마지막이 max 면 + 를 붙인다', () => {
    expect(describeSets([6,6,4,4,5], true)).toBe('6 · 6 · 4 · 4 · 5+');
    expect(describeSets([10,10,10], false)).toBe('10 · 10 · 10');
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx jest __tests__/domain/hundredPushups.test.ts`
Expected: FAIL — `Cannot find module '../../src/domain/hundredPushups'`

- [ ] **Step 3: 표 작성**

```ts
// src/constants/hundredPushups.ts
/**
 * hundredpushups.com 6주 프로그램 표 (스펙 부록 A 원본 그대로).
 * PROGRAM[week-1][day-1].sets[level-1] = 그 날의 세트 목표 배열. 마지막 원소는 "최소 N개, 가능한 만큼".
 */
export type ProgramDay = {
  rest: number; // 세트 사이 휴식(초)
  sets: [number[], number[], number[]]; // 열 1 / 열 2 / 열 3
};

export const WEEKS = 6;
export const DAYS_PER_WEEK = 3;

export const PROGRAM: ProgramDay[][] = [
  // Week 1
  [
    {rest: 60, sets: [[2, 3, 2, 2, 3], [6, 6, 4, 4, 5], [10, 12, 7, 7, 9]]},
    {rest: 60, sets: [[3, 4, 2, 3, 4], [6, 8, 6, 6, 7], [10, 12, 8, 8, 12]]},
    {rest: 60, sets: [[4, 5, 4, 4, 5], [8, 10, 7, 7, 10], [11, 15, 9, 9, 13]]},
  ],
  // Week 2
  [
    {rest: 60, sets: [[4, 6, 4, 4, 6], [9, 11, 8, 8, 11], [14, 14, 10, 10, 15]]},
    {rest: 90, sets: [[5, 6, 4, 4, 7], [10, 12, 9, 9, 13], [14, 16, 12, 12, 17]]},
    {rest: 120, sets: [[5, 7, 5, 5, 8], [12, 13, 10, 10, 15], [16, 17, 14, 14, 20]]},
  ],
  // Week 3 (열: 16–20 / 21–25 / >25)
  [
    {rest: 60, sets: [[10, 12, 7, 7, 9], [12, 17, 13, 13, 17], [14, 18, 14, 14, 20]]},
    {rest: 90, sets: [[10, 12, 8, 8, 12], [14, 19, 14, 14, 19], [20, 25, 15, 15, 25]]},
    {rest: 120, sets: [[11, 13, 9, 9, 13], [16, 21, 15, 15, 21], [22, 30, 20, 20, 28]]},
  ],
  // Week 4 (열: 3주차와 동일)
  [
    {rest: 60, sets: [[12, 14, 11, 10, 16], [18, 22, 16, 16, 25], [21, 25, 21, 21, 32]]},
    {rest: 90, sets: [[14, 16, 12, 12, 18], [20, 25, 20, 20, 28], [25, 29, 25, 25, 36]]},
    {rest: 120, sets: [[16, 18, 13, 13, 20], [23, 28, 23, 23, 33], [29, 33, 29, 29, 40]]},
  ],
  // Week 5 (열: 31–35 / 36–40 / >40)
  [
    {rest: 60, sets: [[17, 19, 15, 15, 20], [28, 35, 25, 22, 35], [36, 40, 30, 24, 40]]},
    {rest: 45, sets: [[10, 10, 13, 13, 10, 10, 9, 25], [18, 18, 20, 20, 14, 14, 16, 40], [19, 19, 22, 22, 18, 18, 22, 45]]},
    {rest: 45, sets: [[13, 13, 15, 15, 12, 12, 10, 30], [18, 18, 20, 20, 17, 17, 20, 45], [20, 20, 24, 24, 20, 20, 22, 50]]},
  ],
  // Week 6 (열: 46–50 / 51–60 / >60)
  [
    {rest: 60, sets: [[25, 30, 20, 15, 40], [40, 50, 25, 25, 50], [45, 55, 35, 30, 55]]},
    {rest: 45, sets: [[14, 14, 15, 15, 14, 14, 10, 10, 44], [20, 20, 23, 23, 20, 20, 18, 18, 53], [22, 22, 30, 30, 24, 24, 18, 18, 58]]},
    {rest: 45, sets: [[13, 13, 17, 17, 16, 16, 14, 14, 50], [22, 22, 30, 30, 25, 25, 18, 18, 55], [26, 26, 33, 33, 26, 26, 22, 22, 60]]},
  ],
];
```

- [ ] **Step 4: 규칙 구현**

```ts
// src/domain/hundredPushups.ts
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

/** 테스트가 있는 주차(끝나면 최대 횟수 테스트) */
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
```

- [ ] **Step 5: 통과 확인**

Run: `npx jest __tests__/domain/hundredPushups.test.ts`
Expected: PASS (모든 케이스)

- [ ] **Step 6: 커밋**

```bash
git add src/constants/hundredPushups.ts src/domain/hundredPushups.ts __tests__/domain/hundredPushups.test.ts
git commit -m "feat: 100개 만들기 프로그램 표와 진행 규칙 추가"
```

---

### Task 2: 세트 운동 상태기계 (domain/workoutSession + useWorkoutSession)

**Files:**
- Create: `src/domain/workoutSession.ts`
- Create: `src/hooks/useWorkoutSession.ts`
- Test: `__tests__/domain/workoutSession.test.ts`

**Interfaces:**
- Produces:
  - `type WorkoutPlan = {sets: number[]; restSeconds: number; lastIsMax: boolean}`
  - `type WorkoutPhase = 'idle' | 'tracking' | 'rest' | 'done'`
  - `type WorkoutState = {plan: WorkoutPlan; phase: WorkoutPhase; setIndex: number; currentCount: number; results: number[]; restRemaining: number}`
  - `type WorkoutEvent = {type: 'start'} | {type: 'count'; count: number} | {type: 'finishSet'} | {type: 'restTick'} | {type: 'skipRest'}`
  - `createWorkout(plan): WorkoutState`, `workoutReducer(state, event): WorkoutState`
  - `targetFor(state): {reps: number; isMax: boolean}`
  - `useWorkoutSession(plan)` → `{state, target, start(), count(n), finishSet(), skipRest()}`

- [ ] **Step 1: 실패하는 테스트 작성**

```ts
// __tests__/domain/workoutSession.test.ts
import {createWorkout, workoutReducer, targetFor, WorkoutState} from '../../src/domain/workoutSession';

const plan = {sets: [3, 3, 5], restSeconds: 2, lastIsMax: true};
const run = (events: Parameters<typeof workoutReducer>[1][], from = createWorkout(plan)) =>
  events.reduce((s, e) => workoutReducer(s, e), from);

describe('workoutSession', () => {
  it('처음엔 idle, 첫 세트 목표를 알려준다', () => {
    const s = createWorkout(plan);
    expect(s.phase).toBe('idle');
    expect(targetFor(s)).toEqual({reps: 3, isMax: false});
  });

  it('start → tracking, count 로 현재 횟수가 올라간다', () => {
    const s = run([{type: 'start'}, {type: 'count', count: 2}]);
    expect(s.phase).toBe('tracking');
    expect(s.currentCount).toBe(2);
  });

  it('목표 도달 시 자동으로 세트가 끝나고 rest 로 간다', () => {
    const s = run([{type: 'start'}, {type: 'count', count: 3}]);
    expect(s.phase).toBe('rest');
    expect(s.results).toEqual([3]);
    expect(s.restRemaining).toBe(2);
  });

  it('max 세트는 목표를 넘어도 자동 종료하지 않고 finishSet 으로 끝난다', () => {
    const last: WorkoutState = {...createWorkout(plan), setIndex: 2, phase: 'tracking', results: [3, 3]};
    const over = workoutReducer(last, {type: 'count', count: 9});
    expect(over.phase).toBe('tracking');
    expect(targetFor(over)).toEqual({reps: 5, isMax: true});
    const done = workoutReducer(over, {type: 'finishSet'});
    expect(done.phase).toBe('done');
    expect(done.results).toEqual([3, 3, 9]);
  });

  it('finishSet 으로 조기 종료하면 실제 횟수로 저장된다', () => {
    const s = run([{type: 'start'}, {type: 'count', count: 1}, {type: 'finishSet'}]);
    expect(s.results).toEqual([1]);
    expect(s.phase).toBe('rest');
  });

  it('restTick 이 0 이 되면 다음 세트 idle', () => {
    const s = run([{type: 'start'}, {type: 'count', count: 3}, {type: 'restTick'}, {type: 'restTick'}]);
    expect(s.phase).toBe('idle');
    expect(s.setIndex).toBe(1);
    expect(s.currentCount).toBe(0);
  });

  it('skipRest 는 바로 다음 세트 idle', () => {
    const s = run([{type: 'start'}, {type: 'count', count: 3}, {type: 'skipRest'}]);
    expect(s.phase).toBe('idle');
    expect(s.setIndex).toBe(1);
  });

  it('마지막 세트가 끝나면 rest 없이 done', () => {
    const s = run([
      {type: 'start'}, {type: 'count', count: 3}, {type: 'skipRest'},
      {type: 'start'}, {type: 'count', count: 3}, {type: 'skipRest'},
      {type: 'start'}, {type: 'count', count: 7}, {type: 'finishSet'},
    ]);
    expect(s.phase).toBe('done');
    expect(s.results).toEqual([3, 3, 7]);
  });

  it('phase 에 맞지 않는 이벤트는 무시한다', () => {
    const idle = createWorkout(plan);
    expect(workoutReducer(idle, {type: 'count', count: 5})).toBe(idle);
    expect(workoutReducer(idle, {type: 'finishSet'})).toBe(idle);
    expect(workoutReducer(idle, {type: 'skipRest'})).toBe(idle);
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx jest __tests__/domain/workoutSession.test.ts`
Expected: FAIL — `Cannot find module '../../src/domain/workoutSession'`

- [ ] **Step 3: 리듀서 구현**

```ts
// src/domain/workoutSession.ts
export type WorkoutPlan = {
  sets: number[]; // 세트별 목표. lastIsMax 면 마지막은 "최소 N개"
  restSeconds: number;
  lastIsMax: boolean;
};

export type WorkoutPhase = 'idle' | 'tracking' | 'rest' | 'done';

export type WorkoutState = {
  plan: WorkoutPlan;
  phase: WorkoutPhase;
  setIndex: number; // 0-based
  currentCount: number;
  results: number[]; // 완료된 세트의 실제 횟수
  restRemaining: number;
};

export type WorkoutEvent =
  | {type: 'start'}
  | {type: 'count'; count: number}
  | {type: 'finishSet'}
  | {type: 'restTick'}
  | {type: 'skipRest'};

export const createWorkout = (plan: WorkoutPlan): WorkoutState => ({
  plan,
  phase: 'idle',
  setIndex: 0,
  currentCount: 0,
  results: [],
  restRemaining: 0,
});

export const targetFor = (state: WorkoutState) => {
  const {sets, lastIsMax} = state.plan;
  const isLast = state.setIndex === sets.length - 1;
  return {reps: sets[state.setIndex], isMax: lastIsMax && isLast};
};

const finishSet = (state: WorkoutState): WorkoutState => {
  const results = [...state.results, state.currentCount];
  const isLast = state.setIndex === state.plan.sets.length - 1;
  if (isLast) {
    return {...state, phase: 'done', results};
  }
  return {...state, phase: 'rest', results, restRemaining: state.plan.restSeconds};
};

const nextSet = (state: WorkoutState): WorkoutState => ({
  ...state,
  phase: 'idle',
  setIndex: state.setIndex + 1,
  currentCount: 0,
  restRemaining: 0,
});

export const workoutReducer = (state: WorkoutState, event: WorkoutEvent): WorkoutState => {
  switch (event.type) {
    case 'start':
      return state.phase === 'idle' ? {...state, phase: 'tracking', currentCount: 0} : state;
    case 'count': {
      if (state.phase !== 'tracking') {
        return state;
      }
      const next = {...state, currentCount: event.count};
      const {reps, isMax} = targetFor(next);
      return !isMax && event.count >= reps ? finishSet(next) : next;
    }
    case 'finishSet':
      return state.phase === 'tracking' ? finishSet(state) : state;
    case 'restTick': {
      if (state.phase !== 'rest') {
        return state;
      }
      const remaining = state.restRemaining - 1;
      return remaining <= 0 ? nextSet(state) : {...state, restRemaining: remaining};
    }
    case 'skipRest':
      return state.phase === 'rest' ? nextSet(state) : state;
    default:
      return state;
  }
};
```

- [ ] **Step 4: 통과 확인**

Run: `npx jest __tests__/domain/workoutSession.test.ts`
Expected: PASS

- [ ] **Step 5: 훅 작성 (리듀서 + 휴식 interval)**

```ts
// src/hooks/useWorkoutSession.ts
import {useCallback, useMemo, useReducer} from 'react';
import useInterval from './useInterval';
import {createWorkout, targetFor, workoutReducer, WorkoutPlan} from '../domain/workoutSession';

export const useWorkoutSession = (plan: WorkoutPlan) => {
  const [state, dispatch] = useReducer(workoutReducer, plan, createWorkout);

  useInterval(() => dispatch({type: 'restTick'}), state.phase === 'rest' ? 1000 : null);

  const start = useCallback(() => dispatch({type: 'start'}), []);
  const count = useCallback((n: number) => dispatch({type: 'count', count: n}), []);
  const finishSet = useCallback(() => dispatch({type: 'finishSet'}), []);
  const skipRest = useCallback(() => dispatch({type: 'skipRest'}), []);
  const target = useMemo(() => targetFor(state), [state]);

  return {state, target, start, count, finishSet, skipRest};
};
```

`useInterval` 시그니처는 `src/hooks/useInterval.ts` 의 `(callback: () => void, delay: number | null)` 를 그대로 쓴다 (기존 `useTimer` 와 동일한 사용법).

- [ ] **Step 6: tsc 확인 후 커밋**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: 오류 0

```bash
git add src/domain/workoutSession.ts src/hooks/useWorkoutSession.ts __tests__/domain/workoutSession.test.ts
git commit -m "feat: 세트 운동 상태기계(useWorkoutSession) 추가"
```

---

### Task 3: 세트 저장 확장 + 프로그램 remote + uuid

**Files:**
- Create: `src/utils/id.ts`
- Modify: `src/remote/pushup.ts` (`SavePushupSessionData`, `savePushupSession`)
- Create: `src/remote/program.ts`
- Test: `__tests__/remote/pushup.test.ts`, `__tests__/remote/program.test.ts`, `__tests__/utils/id.test.ts`

**Interfaces:**
- Consumes: `ProgramState` (Task 1)
- Produces:
  - `generateUuid(): string` (v4 형식)
  - `type WorkoutMode = 'challenge' | 'sets' | 'program' | 'program_test'`
  - `SavePushupSessionData = {reps; duration_seconds; mode?: WorkoutMode; workout_id?: string; set_index?: number; target_reps?: number}`
  - `PushupSetData` 에 `mode`, `workout_id: string | null`, `set_index: number | null`, `target_reps: number | null` 추가
  - `remote/program.ts`: `ProgramRow`, `getActiveProgram(userId): Promise<ProgramRow | null>`, `createProgram(userId, state): Promise<ProgramRow>`, `updateProgram(id, state, completedDay?): Promise<ProgramRow>`, `abandonProgram(id): Promise<void>`, `toProgramState(row): ProgramState`

- [ ] **Step 1: 실패하는 테스트 작성**

```ts
// __tests__/utils/id.test.ts
import {generateUuid} from '../../src/utils/id';

describe('generateUuid', () => {
  it('v4 형식(8-4-4-4-12, 버전 4, variant 8..b)을 만든다', () => {
    expect(generateUuid()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });
  it('매번 다르다', () => {
    expect(new Set(Array.from({length: 20}, generateUuid)).size).toBe(20);
  });
});
```

```ts
// __tests__/remote/pushup.test.ts
import {savePushupSession} from '../../src/remote/pushup';
import {supabase} from '../../src/lib/supabase';

jest.mock('../../src/lib/supabase', () => ({
  supabase: {auth: {getUser: jest.fn()}, from: jest.fn(), rpc: jest.fn()},
}));

const mockFrom = supabase.from as jest.Mock;
const mockGetUser = supabase.auth.getUser as jest.Mock;
const mockRpc = supabase.rpc as jest.Mock;

describe('savePushupSession', () => {
  let insert: jest.Mock;
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUser.mockResolvedValue({data: {user: {id: 'u1'}}});
    insert = jest.fn().mockResolvedValue({error: null});
    mockFrom.mockReturnValue({insert});
    mockRpc.mockResolvedValue({error: null});
  });

  it('모드 없이 저장하면 challenge 로 기록한다', async () => {
    await savePushupSession({reps: 12, duration_seconds: 30});
    expect(insert.mock.calls[0][0]).toMatchObject({user_id: 'u1', reps: 12, duration_seconds: 30, mode: 'challenge'});
    expect(insert.mock.calls[0][0]).not.toHaveProperty('workout_id');
  });

  it('세트 모드 필드를 그대로 넣는다', async () => {
    await savePushupSession({reps: 10, duration_seconds: 20, mode: 'sets', workout_id: 'w1', set_index: 2, target_reps: 10});
    expect(insert.mock.calls[0][0]).toMatchObject({mode: 'sets', workout_id: 'w1', set_index: 2, target_reps: 10});
    expect(mockRpc).toHaveBeenCalledWith('add_daily_pushups', {p_reps: 10});
  });
});
```

```ts
// __tests__/remote/program.test.ts
import {getActiveProgram, createProgram, updateProgram, toProgramState} from '../../src/remote/program';
import {supabase} from '../../src/lib/supabase';

jest.mock('../../src/lib/supabase', () => ({supabase: {from: jest.fn()}}));
const mockFrom = supabase.from as jest.Mock;

const row = {
  id: 'p1', user_id: 'u1', status: 'active', week: 2, day: 3, level: 1,
  last_test_reps: 4, test_due: true, completed_days: [], created_at: '', updated_at: '',
};

describe('remote/program', () => {
  beforeEach(() => jest.clearAllMocks());

  it('getActiveProgram 은 active 행을 돌려주고 없으면 null', async () => {
    const maybeSingle = jest.fn().mockResolvedValue({data: row, error: null});
    const eq2 = jest.fn(() => ({maybeSingle}));
    const eq1 = jest.fn(() => ({eq: eq2}));
    mockFrom.mockReturnValue({select: () => ({eq: eq1})});
    await expect(getActiveProgram('u1')).resolves.toEqual(row);
    expect(eq1).toHaveBeenCalledWith('user_id', 'u1');
    expect(eq2).toHaveBeenCalledWith('status', 'active');

    maybeSingle.mockResolvedValue({data: null, error: null});
    await expect(getActiveProgram('u1')).resolves.toBeNull();
  });

  it('createProgram 은 상태를 컬럼으로 바꿔 insert 한다', async () => {
    const single = jest.fn().mockResolvedValue({data: row, error: null});
    const insert = jest.fn(() => ({select: () => ({single})}));
    mockFrom.mockReturnValue({insert});
    await createProgram('u1', {week: 1, day: 1, level: 2, lastTestReps: 8, testDue: false, status: 'active'});
    expect(insert).toHaveBeenCalledWith({user_id: 'u1', week: 1, day: 1, level: 2, last_test_reps: 8, test_due: false, status: 'active'});
  });

  it('updateProgram 은 완료한 날을 completed_days 에 덧붙인다', async () => {
    const single = jest.fn().mockResolvedValue({data: row, error: null});
    const eq = jest.fn(() => ({select: () => ({single})}));
    const update = jest.fn(() => ({eq}));
    mockFrom.mockReturnValue({update});
    await updateProgram(
      'p1',
      {week: 1, day: 2, level: 2, lastTestReps: 8, testDue: false, status: 'active'},
      {week: 1, day: 1, reps: [6, 6, 4, 4, 7], completed_at: '2026-08-30T00:00:00.000Z'},
      [],
    );
    const patch = (update.mock.calls[0] as unknown[])[0] as Record<string, unknown>;
    expect(patch).toMatchObject({week: 1, day: 2, level: 2, test_due: false});
    expect(patch.completed_days).toEqual([{week: 1, day: 1, reps: [6, 6, 4, 4, 7], completed_at: '2026-08-30T00:00:00.000Z'}]);
    expect(eq).toHaveBeenCalledWith('id', 'p1');
  });

  it('toProgramState 는 row → state', () => {
    expect(toProgramState(row)).toEqual({week: 2, day: 3, level: 1, lastTestReps: 4, testDue: true, status: 'active'});
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx jest __tests__/utils/id.test.ts __tests__/remote/pushup.test.ts __tests__/remote/program.test.ts`
Expected: FAIL — id/program 모듈 없음, pushup 테스트는 `mode` 가 insert 에 없어서 실패

- [ ] **Step 3: 구현**

```ts
// src/utils/id.ts
/** RN(Hermes)에는 crypto.randomUUID 가 없어 Math.random 기반 v4 형식 uuid 를 만든다. 세트 묶음 식별용. */
export const generateUuid = (): string =>
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
```

`src/remote/pushup.ts` 수정:

```ts
export type WorkoutMode = 'challenge' | 'sets' | 'program' | 'program_test';

export interface PushupSetData {
  id: string;
  workout_date: string;
  reps: number;
  duration_seconds: number;
  created_at: string;
  mode: WorkoutMode;
  workout_id: string | null;
  set_index: number | null;
  target_reps: number | null;
}

export interface SavePushupSessionData {
  reps: number;
  duration_seconds: number;
  mode?: WorkoutMode;
  workout_id?: string;
  set_index?: number;
  target_reps?: number;
}
```

`savePushupSession` 의 insert 를 아래로 교체:

```ts
    const {error} = await supabase.from('pushup_sets').insert({
      user_id: user.user.id,
      workout_date: formatKSTDate(new Date()),
      reps: data.reps,
      duration_seconds: data.duration_seconds,
      created_at: new Date().toISOString(),
      mode: data.mode ?? 'challenge',
      ...(data.workout_id !== undefined && {workout_id: data.workout_id}),
      ...(data.set_index !== undefined && {set_index: data.set_index}),
      ...(data.target_reps !== undefined && {target_reps: data.target_reps}),
    });
```

```ts
// src/remote/program.ts
import {supabase} from '../lib/supabase';
import {ProgramState, Level} from '../domain/hundredPushups';

export interface CompletedDay {
  week: number;
  day: number;
  reps: number[];
  completed_at: string;
}

export interface ProgramRow {
  id: string;
  user_id: string;
  status: 'active' | 'completed' | 'abandoned';
  week: number;
  day: number;
  level: Level;
  last_test_reps: number;
  test_due: boolean;
  completed_days: CompletedDay[];
  created_at: string;
  updated_at: string;
}

const toColumns = (state: ProgramState) => ({
  week: state.week,
  day: state.day,
  level: state.level,
  last_test_reps: state.lastTestReps,
  test_due: state.testDue,
  status: state.status,
});

export const toProgramState = (row: ProgramRow): ProgramState => ({
  week: row.week,
  day: row.day,
  level: row.level,
  lastTestReps: row.last_test_reps,
  testDue: row.test_due,
  status: row.status === 'completed' ? 'completed' : 'active',
});

export const getActiveProgram = async (userId: string): Promise<ProgramRow | null> => {
  const {data, error} = await supabase
    .from('pushup_programs')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle();
  if (error) {
    throw error;
  }
  return data;
};

export const createProgram = async (userId: string, state: ProgramState): Promise<ProgramRow> => {
  const {data, error} = await supabase
    .from('pushup_programs')
    .insert({user_id: userId, ...toColumns(state)})
    .select()
    .single();
  if (error) {
    throw error;
  }
  return data;
};

/**
 * 진행 상태 저장. completedDay 를 주면 기존 completed_days(existing) 뒤에 덧붙인다.
 */
export const updateProgram = async (
  id: string,
  state: ProgramState,
  completedDay?: CompletedDay,
  existing: CompletedDay[] = [],
): Promise<ProgramRow> => {
  const patch = {
    ...toColumns(state),
    updated_at: new Date().toISOString(),
    ...(completedDay && {completed_days: [...existing, completedDay]}),
  };
  const {data, error} = await supabase
    .from('pushup_programs')
    .update(patch)
    .eq('id', id)
    .select()
    .single();
  if (error) {
    throw error;
  }
  return data;
};

export const abandonProgram = async (id: string): Promise<void> => {
  const {error} = await supabase
    .from('pushup_programs')
    .update({status: 'abandoned', updated_at: new Date().toISOString()})
    .eq('id', id);
  if (error) {
    throw error;
  }
};
```

- [ ] **Step 4: 통과 확인**

Run: `npx jest __tests__/utils/id.test.ts __tests__/remote/pushup.test.ts __tests__/remote/program.test.ts`
Expected: PASS

- [ ] **Step 5: 커밋**

```bash
git add src/utils/id.ts src/remote/pushup.ts src/remote/program.ts __tests__/utils/id.test.ts __tests__/remote/pushup.test.ts __tests__/remote/program.test.ts
git commit -m "feat: 세트 저장에 모드/운동 묶음 필드 추가, 프로그램 remote 추가"
```

---

### Task 4: 프로그램 tanstack 쿼리/뮤테이션 + 세트 프리셋 유틸

**Files:**
- Modify: `src/tanstack-query/queryKeys.ts` (`program` 키 추가)
- Create: `src/tanstack-query/queryOptions/program.ts`, `src/tanstack-query/mutationHooks/program.ts`
- Modify: `src/tanstack-query/index.ts` (export 추가)
- Create: `src/utils/setsPreset.ts`
- Test: `__tests__/utils/setsPreset.test.ts`

**Interfaces:**
- Produces:
  - `queryKeys.program = {all: ['program'], active: ['program', 'active']}`
  - `activeProgramQueryOptions(userId)` → `{queryKey, queryFn, enabled}`
  - `useCreateProgramMutation()`, `useUpdateProgramMutation()`, `useAbandonProgramMutation()` — 성공 시 `queryKeys.program.all` 무효화
  - `type SetsConfig = {sets: number; reps: number; rest: number}`
  - `SETS_PRESETS: {label: string; config: SetsConfig}[]`, `DEFAULT_SETS_CONFIG`, `SETS_LIMITS`
  - `clampSetsConfig(c: SetsConfig): SetsConfig`, `loadLastSetsConfig(): Promise<SetsConfig>`, `saveLastSetsConfig(c): Promise<void>`
  - `toWorkoutPlan(c: SetsConfig): WorkoutPlan`

- [ ] **Step 1: 실패하는 테스트 작성**

```ts
// __tests__/utils/setsPreset.test.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  SETS_PRESETS, DEFAULT_SETS_CONFIG, clampSetsConfig, loadLastSetsConfig, saveLastSetsConfig, toWorkoutPlan,
} from '../../src/utils/setsPreset';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(), setItem: jest.fn(),
}));
const mockGet = AsyncStorage.getItem as jest.Mock;
const mockSet = AsyncStorage.setItem as jest.Mock;

describe('setsPreset', () => {
  beforeEach(() => jest.clearAllMocks());

  it('프리셋은 3×10 / 5×15 / 5×20 이고 기본값은 3×10 휴식 60', () => {
    expect(SETS_PRESETS.map(p => p.label)).toEqual(['3 × 10', '5 × 15', '5 × 20']);
    expect(DEFAULT_SETS_CONFIG).toEqual({sets: 3, reps: 10, rest: 60});
  });

  it('범위를 벗어나면 잘라낸다 (세트 1–10, 목표 5–100, 휴식 30–180)', () => {
    expect(clampSetsConfig({sets: 0, reps: 3, rest: 10})).toEqual({sets: 1, reps: 5, rest: 30});
    expect(clampSetsConfig({sets: 11, reps: 200, rest: 999})).toEqual({sets: 10, reps: 100, rest: 180});
  });

  it('저장된 설정이 없거나 깨져 있으면 기본값', async () => {
    mockGet.mockResolvedValueOnce(null);
    await expect(loadLastSetsConfig()).resolves.toEqual(DEFAULT_SETS_CONFIG);
    mockGet.mockResolvedValueOnce('not json');
    await expect(loadLastSetsConfig()).resolves.toEqual(DEFAULT_SETS_CONFIG);
  });

  it('저장·복원 시 범위 보정을 거친다', async () => {
    await saveLastSetsConfig({sets: 5, reps: 20, rest: 90});
    expect(mockSet).toHaveBeenCalledWith('sets-config', JSON.stringify({sets: 5, reps: 20, rest: 90}));
    mockGet.mockResolvedValueOnce(JSON.stringify({sets: 50, reps: 20, rest: 90}));
    await expect(loadLastSetsConfig()).resolves.toEqual({sets: 10, reps: 20, rest: 90});
  });

  it('toWorkoutPlan 은 세트 수만큼 목표를 펼치고 max 세트 없음', () => {
    expect(toWorkoutPlan({sets: 3, reps: 10, rest: 60})).toEqual({sets: [10, 10, 10], restSeconds: 60, lastIsMax: false});
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx jest __tests__/utils/setsPreset.test.ts`
Expected: FAIL — 모듈 없음

- [ ] **Step 3: 구현**

```ts
// src/utils/setsPreset.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import {WorkoutPlan} from '../domain/workoutSession';

export type SetsConfig = {sets: number; reps: number; rest: number};

export const SETS_LIMITS = {
  sets: {min: 1, max: 10, step: 1},
  reps: {min: 5, max: 100, step: 5},
  rest: {min: 30, max: 180, step: 15},
} as const;

export const DEFAULT_SETS_CONFIG: SetsConfig = {sets: 3, reps: 10, rest: 60};

export const SETS_PRESETS: {label: string; config: SetsConfig}[] = [
  {label: '3 × 10', config: {sets: 3, reps: 10, rest: 60}},
  {label: '5 × 15', config: {sets: 5, reps: 15, rest: 60}},
  {label: '5 × 20', config: {sets: 5, reps: 20, rest: 60}},
];

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

export const clampSetsConfig = (c: SetsConfig): SetsConfig => ({
  sets: clamp(c.sets, SETS_LIMITS.sets.min, SETS_LIMITS.sets.max),
  reps: clamp(c.reps, SETS_LIMITS.reps.min, SETS_LIMITS.reps.max),
  rest: clamp(c.rest, SETS_LIMITS.rest.min, SETS_LIMITS.rest.max),
});

const STORAGE_KEY = 'sets-config';

export const loadLastSetsConfig = async (): Promise<SetsConfig> => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return DEFAULT_SETS_CONFIG;
    }
    const parsed = JSON.parse(raw);
    if (typeof parsed?.sets !== 'number' || typeof parsed?.reps !== 'number' || typeof parsed?.rest !== 'number') {
      return DEFAULT_SETS_CONFIG;
    }
    return clampSetsConfig(parsed);
  } catch {
    return DEFAULT_SETS_CONFIG;
  }
};

export const saveLastSetsConfig = async (c: SetsConfig): Promise<void> => {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(clampSetsConfig(c)));
};

export const toWorkoutPlan = (c: SetsConfig): WorkoutPlan => ({
  sets: Array.from({length: c.sets}, () => c.reps),
  restSeconds: c.rest,
  lastIsMax: false,
});
```

`src/tanstack-query/queryKeys.ts` 의 `profile` 아래에 추가:

```ts
  // 100개 만들기 프로그램
  program: {
    all: ['program'] as const,
    active: ['program', 'active'] as const,
  },
```

```ts
// src/tanstack-query/queryOptions/program.ts
import {getActiveProgram} from '../../remote/program';
import {queryKeys} from '../queryKeys';

export const activeProgramQueryOptions = (userId: string) => ({
  queryKey: queryKeys.program.active,
  queryFn: () => getActiveProgram(userId),
  enabled: !!userId,
});
```

```ts
// src/tanstack-query/mutationHooks/program.ts
import {useMutation, useQueryClient} from '@tanstack/react-query';
import {abandonProgram, createProgram, updateProgram, CompletedDay} from '../../remote/program';
import {ProgramState} from '../../domain/hundredPushups';
import {queryKeys} from '../queryKeys';

const useInvalidateProgram = () => {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({queryKey: queryKeys.program.all});
};

export const useCreateProgramMutation = () => {
  const invalidate = useInvalidateProgram();
  return useMutation({
    mutationFn: ({userId, state}: {userId: string; state: ProgramState}) => createProgram(userId, state),
    onSuccess: invalidate,
    onError: error => console.error('프로그램 생성 실패:', error),
  });
};

export const useUpdateProgramMutation = () => {
  const invalidate = useInvalidateProgram();
  return useMutation({
    mutationFn: ({id, state, completedDay, existing}: {
      id: string; state: ProgramState; completedDay?: CompletedDay; existing?: CompletedDay[];
    }) => updateProgram(id, state, completedDay, existing),
    onSuccess: invalidate,
    onError: error => console.error('프로그램 갱신 실패:', error),
  });
};

export const useAbandonProgramMutation = () => {
  const invalidate = useInvalidateProgram();
  return useMutation({
    mutationFn: (id: string) => abandonProgram(id),
    onSuccess: invalidate,
    onError: error => console.error('프로그램 중단 실패:', error),
  });
};
```

`src/tanstack-query/index.ts` 끝에 추가:

```ts
export {activeProgramQueryOptions} from './queryOptions/program';
export {
  useCreateProgramMutation,
  useUpdateProgramMutation,
  useAbandonProgramMutation,
} from './mutationHooks/program';
```

- [ ] **Step 4: 통과 + tsc 확인**

Run: `npx jest __tests__/utils/setsPreset.test.ts && npx tsc --noEmit -p tsconfig.json`
Expected: PASS, tsc 오류 0

- [ ] **Step 5: 커밋**

```bash
git add src/tanstack-query src/utils/setsPreset.ts __tests__/utils/setsPreset.test.ts
git commit -m "feat: 프로그램 쿼리/뮤테이션 훅과 세트 프리셋 유틸 추가"
```

---

### Task 5: 네비게이션 라우트/타입 + 챌린지 화면의 테스트 용도 지원

**Files:**
- Modify: `src/navigations/AppNavigation.tsx` (screens, `AppStackParamList`)
- Modify: `src/screens/ChallengeScreen.tsx` (route param `purpose`)
- Modify: `src/components/features/push-up/ChallengeResult.tsx` (`purpose` prop)
- Create: 임시 빈 화면 3개는 만들지 않는다 — Task 6~8 화면 파일을 이 태스크에서 **최소 스텁**으로 먼저 만들고 이후 태스크에서 채운다: `src/screens/SetsSetupScreen.tsx`, `src/screens/WorkoutScreen.tsx`, `src/screens/ProgramScreen.tsx`

**Interfaces:**
- Produces (라우트 파라미터):
  - `Challenge: {purpose?: 'program-test'} | undefined`
  - `SetsSetup: undefined`
  - `Workout: {plan: WorkoutPlan; source: {kind: 'sets'} | {kind: 'program'; programId: string}}`
  - `Program: {testReps?: number} | undefined`

- [ ] **Step 1: 스텁 화면 3개 작성** (각각 동일한 형태, 이름만 다름)

```tsx
// src/screens/SetsSetupScreen.tsx  (WorkoutScreen.tsx / ProgramScreen.tsx 도 같은 형태로)
import React from 'react';
import {SafeAreaView, StyleSheet} from 'react-native';
import Header from '../components/common/Header';
import {useNavigation} from '@react-navigation/native';
import {colors} from '../constants/colors';

function SetsSetupScreen() {
  const navigation = useNavigation();
  return (
    <SafeAreaView style={styles.container}>
      <Header title="세트" onBackPress={() => navigation.goBack()} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.backgroundDark},
});

export default SetsSetupScreen;
```

- [ ] **Step 2: 네비게이션 등록**

`src/navigations/AppNavigation.tsx`:

```tsx
import SetsSetupScreen from '../screens/SetsSetupScreen';
import WorkoutScreen from '../screens/WorkoutScreen';
import ProgramScreen from '../screens/ProgramScreen';
import {WorkoutPlan} from '../domain/workoutSession';
// screens: 에 추가
    SetsSetup: SetsSetupScreen,
    Workout: WorkoutScreen,
    Program: ProgramScreen,
```

`AppStackParamList` 를 아래로 교체:

```ts
export type WorkoutSource = {kind: 'sets'} | {kind: 'program'; programId: string};

export type AppStackParamList = {
  Tabs: NavigatorScreenParams<BottomTabParamList>;
  Challenge: {purpose?: 'program-test'} | undefined;
  SetsSetup: undefined;
  Workout: {plan: WorkoutPlan; source: WorkoutSource};
  Program: {testReps?: number} | undefined;
  Setting: undefined;
  TermsOfService: undefined;
  PrivacyPolicy: undefined;
  Leaderboard: undefined;
  AccountSettings: undefined;
  ProfileEdit: undefined;
};
```

- [ ] **Step 3: ChallengeScreen 에 purpose 전달**

`src/screens/ChallengeScreen.tsx`:

```tsx
import {RouteProp, useRoute} from '@react-navigation/native';
import {AppStackParamList} from '../navigations/AppNavigation';
// 함수 안:
  const route = useRoute<RouteProp<AppStackParamList, 'Challenge'>>();
  const purpose = route.params?.purpose;
// 결과 화면 호출:
  if (isPushUpFinished) {
    return <ChallengeResult pushUpCount={pushUpCount} duration={elapsedTime} purpose={purpose} />;
  }
```

`ChallengeResult.tsx`:

```tsx
interface ChallengeResultProps {
  pushUpCount: number;
  duration: number;
  purpose?: 'program-test';
}
// props 에 purpose 추가, mutation 성공/실패 콜백을 아래로 교체:
  const goNext = () => {
    if (purpose === 'program-test') {
      navigation.navigate('Program', {testReps: pushUpCount});
    } else {
      navigation.navigate('Tabs' as never);
    }
  };
  const savePushupMutation = useSavePushupSessionMutation(goNext, error => {
    console.error('푸쉬업 세션 저장 실패:', error);
    goNext();
  });

  const handleSaveAndGoHome = () => {
    if (pushUpCount === 0) {
      return;
    }
    savePushupMutation.mutate({
      reps: pushUpCount,
      duration_seconds: duration,
      mode: purpose === 'program-test' ? 'program_test' : 'challenge',
    });
  };
// 하단 버튼 title / onPress:
            title={
              pushUpCount > 0
                ? purpose === 'program-test' ? '기록하고 프로그램으로' : '기록하고 홈으로 이동'
                : purpose === 'program-test' ? '프로그램으로' : '홈으로 이동'
            }
            onPress={() => {
              if (pushUpCount > 0) {
                handleSaveAndGoHome();
              } else if (purpose === 'program-test') {
                navigation.navigate('Program');
              } else {
                navigation.navigate('Tabs', {screen: 'Home'});
              }
            }}
```

- [ ] **Step 4: tsc/eslint 확인 후 커밋**

Run: `npx tsc --noEmit -p tsconfig.json && npx eslint src`
Expected: 오류 0

```bash
git add src/navigations/AppNavigation.tsx src/screens/ChallengeScreen.tsx src/components/features/push-up/ChallengeResult.tsx src/screens/SetsSetupScreen.tsx src/screens/WorkoutScreen.tsx src/screens/ProgramScreen.tsx
git commit -m "feat: 운동 모드 라우트 추가, 챌린지 화면 프로그램 테스트 용도 지원"
```

---

### Task 6: 홈 3카드 + ModeCard

**Files:**
- Create: `src/components/features/home/ModeCard.tsx`
- Modify: `src/screens/HomeScreen.tsx` (전체 교체)

**Interfaces:**
- Consumes: `activeProgramQueryOptions` (Task 4), `toProgramState` (Task 3), `describeSets`/`todayPlan` (Task 1)
- Produces: `ModeCard({title, description, status?, onPress})`

- [ ] **Step 1: ModeCard**

```tsx
// src/components/features/home/ModeCard.tsx
import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {colors} from '../../../constants/colors';

interface ModeCardProps {
  title: string;
  description: string;
  status?: string;
  onPress: () => void;
}

/** 텍스트만 있는 평평한 카드. 아이콘/장식 없음 (Material 느낌). */
function ModeCard({title, description, status, onPress}: ModeCardProps) {
  return (
    <Pressable
      onPress={onPress}
      android_ripple={{color: colors.overlayMedium}}
      style={({pressed}) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.row}>
        <Text style={styles.title}>{title}</Text>
        {status ? <Text style={styles.status}>{status}</Text> : null}
      </View>
      <Text style={styles.description}>{description}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.overlayLight,
    borderRadius: 16,
    padding: 20,
    gap: 6,
  },
  pressed: {
    backgroundColor: colors.overlayMedium,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textLight,
  },
  status: {
    fontSize: 13,
    color: colors.primaryLight,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.gray400,
  },
});

export default ModeCard;
```

- [ ] **Step 2: HomeScreen 교체**

```tsx
// src/screens/HomeScreen.tsx
import React from 'react';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {StyleSheet, Text, View} from 'react-native';
import {useQuery} from '@tanstack/react-query';
import {colors} from '../constants/colors';
import Logo from '../assets/svgs/logo.svg';
import ModeCard from '../components/features/home/ModeCard';
import {useSession} from '../hooks/useSession';
import {activeProgramQueryOptions} from '../tanstack-query';
import {toProgramState} from '../remote/program';

const programStatusText = (
  program: ReturnType<typeof toProgramState> | null | undefined,
): string => {
  if (!program) {
    return '시작 전';
  }
  if (program.testDue) {
    return '테스트 차례';
  }
  return `${program.week}주차 · Day ${program.day}`;
};

function HomeScreen(): React.JSX.Element {
  const navigation = useNavigation();
  const {user} = useSession();
  const {data: programRow} = useQuery(activeProgramQueryOptions(user?.id ?? ''));
  const program = programRow ? toProgramState(programRow) : null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.titleRow}>
        <Logo width={26} height={26} fill={colors.primary} />
        <Text style={styles.title}>PushOn</Text>
      </View>

      <View style={styles.cards}>
        <ModeCard
          title="챌린지"
          description="한 세트에 몇 개까지 되는지 도전해요"
          onPress={() => navigation.navigate('Challenge')}
        />
        <ModeCard
          title="세트"
          description="세트 수와 목표 횟수를 정하고 휴식까지 챙겨요"
          onPress={() => navigation.navigate('SetsSetup')}
        />
        <ModeCard
          title="100개 만들기"
          description="6주 프로그램으로 연속 100개까지"
          status={programStatusText(program)}
          onPress={() => navigation.navigate('Program')}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    padding: 20,
    backgroundColor: colors.backgroundDark,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 32,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textLight,
  },
  cards: {
    gap: 12,
  },
});

export default HomeScreen;
```

- [ ] **Step 3: tsc/eslint 확인 후 커밋**

Run: `npx tsc --noEmit -p tsconfig.json && npx eslint src`
Expected: 오류 0

```bash
git add src/components/features/home/ModeCard.tsx src/screens/HomeScreen.tsx
git commit -m "feat: 홈 화면을 모드 카드 3개로 교체"
```

---

### Task 7: 세트 설정 화면

**Files:**
- Modify: `src/screens/SetsSetupScreen.tsx` (스텁 → 구현)
- Create: `src/components/features/workout/Stepper.tsx`

**Interfaces:**
- Consumes: `SETS_PRESETS`, `SETS_LIMITS`, `clampSetsConfig`, `loadLastSetsConfig`, `saveLastSetsConfig`, `toWorkoutPlan` (Task 4)
- Produces: `Stepper({label, value, unit, min, max, step, onChange})`

- [ ] **Step 1: Stepper**

```tsx
// src/components/features/workout/Stepper.tsx
import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {colors} from '../../../constants/colors';

interface StepperProps {
  label: string;
  value: number;
  unit: string;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}

function Stepper({label, value, unit, min, max, step, onChange}: StepperProps) {
  const dec = () => onChange(Math.max(min, value - step));
  const inc = () => onChange(Math.min(max, value + step));
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.controls}>
        <Pressable onPress={dec} disabled={value <= min} style={styles.button}>
          <Text style={[styles.buttonText, value <= min && styles.disabled]}>−</Text>
        </Pressable>
        <Text style={styles.value}>
          {value}
          <Text style={styles.unit}> {unit}</Text>
        </Text>
        <Pressable onPress={inc} disabled={value >= max} style={styles.button}>
          <Text style={[styles.buttonText, value >= max && styles.disabled]}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12},
  label: {fontSize: 16, color: colors.textLight},
  controls: {flexDirection: 'row', alignItems: 'center', gap: 8},
  button: {width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.overlayMedium},
  buttonText: {fontSize: 22, color: colors.textLight},
  disabled: {opacity: 0.3},
  value: {minWidth: 72, textAlign: 'center', fontSize: 18, fontWeight: '600', color: colors.textLight},
  unit: {fontSize: 13, fontWeight: '400', color: colors.gray400},
});

export default Stepper;
```

- [ ] **Step 2: SetsSetupScreen**

```tsx
// src/screens/SetsSetupScreen.tsx
import React, {useEffect, useState} from 'react';
import {Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import Header from '../components/common/Header';
import CustomButton from '../components/common/CustomButton';
import Stepper from '../components/features/workout/Stepper';
import {colors} from '../constants/colors';
import {
  SETS_LIMITS, SETS_PRESETS, SetsConfig, clampSetsConfig, loadLastSetsConfig, saveLastSetsConfig, toWorkoutPlan,
} from '../utils/setsPreset';

const sameConfig = (a: SetsConfig, b: SetsConfig) => a.sets === b.sets && a.reps === b.reps && a.rest === b.rest;

function SetsSetupScreen() {
  const navigation = useNavigation();
  const [config, setConfig] = useState<SetsConfig | null>(null);

  useEffect(() => {
    loadLastSetsConfig().then(setConfig);
  }, []);

  if (!config) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="세트" onBackPress={() => navigation.goBack()} />
      </SafeAreaView>
    );
  }

  const update = (patch: Partial<SetsConfig>) => setConfig(clampSetsConfig({...config, ...patch}));

  const handleStart = async () => {
    await saveLastSetsConfig(config);
    navigation.navigate('Workout', {plan: toWorkoutPlan(config), source: {kind: 'sets'}});
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header title="세트" onBackPress={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>프리셋</Text>
        <View style={styles.chips}>
          {SETS_PRESETS.map(preset => {
            const selected = sameConfig(preset.config, config);
            return (
              <Pressable
                key={preset.label}
                onPress={() => setConfig(preset.config)}
                style={[styles.chip, selected && styles.chipSelected]}>
                <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{preset.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.sectionTitle}>직접 설정</Text>
        <View style={styles.card}>
          <Stepper label="세트 수" value={config.sets} unit="세트" {...SETS_LIMITS.sets} onChange={v => update({sets: v})} />
          <Stepper label="세트당 목표" value={config.reps} unit="회" {...SETS_LIMITS.reps} onChange={v => update({reps: v})} />
          <Stepper label="세트 사이 휴식" value={config.rest} unit="초" {...SETS_LIMITS.rest} onChange={v => update({rest: v})} />
        </View>

        <Text style={styles.summary}>
          {config.sets}세트 × {config.reps}회 · 휴식 {config.rest}초
        </Text>
        <CustomButton title="시작" variant="start" style={styles.startButton} onPress={handleStart} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.backgroundDark},
  content: {padding: 20, gap: 12},
  sectionTitle: {fontSize: 14, color: colors.gray400, marginTop: 8},
  chips: {flexDirection: 'row', gap: 8},
  chip: {paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: colors.overlayLight},
  chipSelected: {backgroundColor: colors.primary},
  chipText: {fontSize: 15, color: colors.textLight},
  chipTextSelected: {fontWeight: '600'},
  card: {backgroundColor: colors.overlayLight, borderRadius: 16, paddingHorizontal: 20, paddingVertical: 8},
  summary: {textAlign: 'center', fontSize: 15, color: colors.textSecondary, marginTop: 8},
  startButton: {marginTop: 8},
});

export default SetsSetupScreen;
```

- [ ] **Step 3: tsc/eslint 확인 후 커밋**

Run: `npx tsc --noEmit -p tsconfig.json && npx eslint src`
Expected: 오류 0

```bash
git add src/screens/SetsSetupScreen.tsx src/components/features/workout/Stepper.tsx
git commit -m "feat: 세트 모드 설정 화면(프리셋/커스텀) 추가"
```

---

### Task 8: 운동 화면 (세트/프로그램 공용)

**Files:**
- Modify: `src/screens/WorkoutScreen.tsx` (스텁 → 구현)
- Create: `src/components/features/workout/WorkoutHeader.tsx`, `RestTimer.tsx`, `WorkoutSummary.tsx`

**Interfaces:**
- Consumes: `useWorkoutSession` (Task 2), `usePushUpManager`, `useSavePushupSessionMutation`, `generateUuid` (Task 3), `useUpdateProgramMutation` + `activeProgramQueryOptions` (Task 4), `completeDay`/`toProgramState` (Task 1/3), 기존 `Count`, `TimerContainer`, `Engagement`, `CustomButton`, `formatTime`
- Produces: `WorkoutHeader({setNumber, totalSets, target: {reps, isMax}})`, `RestTimer({remaining, onSkip})`, `WorkoutSummary({plan, results, totalSeconds, onDone, doneLabel})`

- [ ] **Step 1: 컴포넌트 3개**

```tsx
// src/components/features/workout/WorkoutHeader.tsx
import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {colors} from '../../../constants/colors';

interface WorkoutHeaderProps {
  setNumber: number; // 1-based
  totalSets: number;
  target: {reps: number; isMax: boolean};
}

function WorkoutHeader({setNumber, totalSets, target}: WorkoutHeaderProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.set}>세트 {setNumber} / {totalSets}</Text>
      <Text style={styles.target}>
        {target.isMax ? `최소 ${target.reps}회, 가능한 만큼` : `목표 ${target.reps}회`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {alignItems: 'center', gap: 4, marginBottom: 32},
  set: {fontSize: 26, fontWeight: 'bold', color: colors.textSecondary},
  target: {fontSize: 15, color: colors.gray400},
});

export default WorkoutHeader;
```

```tsx
// src/components/features/workout/RestTimer.tsx
import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import CustomButton from '../../common/CustomButton';
import {colors} from '../../../constants/colors';

interface RestTimerProps {
  remaining: number;
  onSkip: () => void;
}

function RestTimer({remaining, onSkip}: RestTimerProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>휴식</Text>
      <Text style={styles.seconds}>{remaining}</Text>
      <Text style={styles.hint}>끝나면 다음 세트를 시작할 수 있어요</Text>
      <CustomButton title="건너뛰기" variant="default" style={styles.button} onPress={onSkip} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12},
  label: {fontSize: 18, color: colors.textSecondary},
  seconds: {fontSize: 96, fontWeight: 'bold', color: colors.textLight},
  hint: {fontSize: 14, color: colors.gray400},
  button: {marginTop: 24, minWidth: 160},
});

export default RestTimer;
```

```tsx
// src/components/features/workout/WorkoutSummary.tsx
import React from 'react';
import {SafeAreaView} from 'react-native-safe-area-context';
import {ScrollView, StyleSheet, Text, View} from 'react-native';
import CustomButton from '../../common/CustomButton';
import {colors} from '../../../constants/colors';
import {WorkoutPlan} from '../../../domain/workoutSession';
import {formatTime} from '../../../utils/time';

interface WorkoutSummaryProps {
  plan: WorkoutPlan;
  results: number[];
  totalSeconds: number;
  doneLabel: string;
  onDone: () => void;
}

function WorkoutSummary({plan, results, totalSeconds, doneLabel, onDone}: WorkoutSummaryProps) {
  const total = results.reduce((a, b) => a + b, 0);
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>운동 완료</Text>
        <View style={styles.totals}>
          <View style={styles.totalItem}>
            <Text style={styles.totalNumber}>{total}</Text>
            <Text style={styles.totalLabel}>총 횟수</Text>
          </View>
          <View style={styles.totalItem}>
            <Text style={styles.totalNumber}>{formatTime(totalSeconds)}</Text>
            <Text style={styles.totalLabel}>총 시간</Text>
          </View>
        </View>
        <View style={styles.table}>
          {results.map((reps, i) => {
            const isMax = plan.lastIsMax && i === plan.sets.length - 1;
            return (
              <View key={i} style={styles.row}>
                <Text style={styles.rowLabel}>세트 {i + 1}</Text>
                <Text style={styles.rowValue}>
                  {reps} / {plan.sets[i]}{isMax ? '+' : ''}
                </Text>
              </View>
            );
          })}
        </View>
        <CustomButton title={doneLabel} variant="start" style={styles.button} onPress={onDone} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {flex: 1, backgroundColor: colors.backgroundDark},
  content: {padding: 20, gap: 20},
  title: {fontSize: 28, fontWeight: 'bold', color: colors.textLight, marginTop: 40, textAlign: 'center'},
  totals: {flexDirection: 'row', gap: 12},
  totalItem: {flex: 1, alignItems: 'center', backgroundColor: colors.overlayMedium, padding: 24, borderRadius: 16},
  totalNumber: {fontSize: 28, fontWeight: 'bold', color: colors.textLight},
  totalLabel: {fontSize: 13, color: colors.gray400, marginTop: 4},
  table: {backgroundColor: colors.overlayLight, borderRadius: 16, paddingHorizontal: 20, paddingVertical: 8},
  row: {flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12},
  rowLabel: {fontSize: 16, color: colors.textSecondary},
  rowValue: {fontSize: 16, fontWeight: '600', color: colors.textLight},
  button: {marginTop: 12},
});

export default WorkoutSummary;
```

- [ ] **Step 2: WorkoutScreen**

```tsx
// src/screens/WorkoutScreen.tsx
import React, {useEffect, useRef, useState} from 'react';
import {Alert, StyleSheet, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {RouteProp, useNavigation, useRoute} from '@react-navigation/native';
import {useQuery} from '@tanstack/react-query';
import usePushUpManager from '../hooks/usePushUpManager';
import {useWorkoutSession} from '../hooks/useWorkoutSession';
import {useSession} from '../hooks/useSession';
import CustomButton from '../components/common/CustomButton';
import Count from '../components/features/push-up/Count';
import TimerContainer from '../components/features/push-up/TimerContainer';
import Engagement from '../components/features/push-up/Engagement';
import WorkoutHeader from '../components/features/workout/WorkoutHeader';
import RestTimer from '../components/features/workout/RestTimer';
import WorkoutSummary from '../components/features/workout/WorkoutSummary';
import {colors} from '../constants/colors';
import {formatTime} from '../utils/time';
import {generateUuid} from '../utils/id';
import {savePushupSession} from '../remote/pushup';
import {toProgramState} from '../remote/program';
import {completeDay} from '../domain/hundredPushups';
import {AppStackParamList} from '../navigations/AppNavigation';
import {activeProgramQueryOptions, useUpdateProgramMutation} from '../tanstack-query';
import {useQueryClient} from '@tanstack/react-query';
import {queryKeys} from '../tanstack-query/queryKeys';

function WorkoutScreen(): React.JSX.Element {
  const navigation = useNavigation();
  const {params} = useRoute<RouteProp<AppStackParamList, 'Workout'>>();
  const {plan, source} = params;
  const {user} = useSession();
  const queryClient = useQueryClient();

  const manager = usePushUpManager();
  const session = useWorkoutSession(plan);
  const {state, target} = session;

  const workoutId = useRef(generateUuid()).current;
  const setStartedAt = useRef(0);
  const totalSeconds = useRef(0);
  const [saveError, setSaveError] = useState(false);

  const {data: programRow} = useQuery({
    ...activeProgramQueryOptions(user?.id ?? ''),
    enabled: source.kind === 'program' && !!user?.id,
  });
  const updateProgram = useUpdateProgramMutation();
  const programUpdated = useRef(false);

  // 네이티브 카운트 → 상태기계
  useEffect(() => {
    session.count(manager.pushUpCount);
  }, [manager.pushUpCount, session]);

  // 세트 하나가 끝났을 때(결과 개수가 늘었을 때) 저장 + 네이티브 정지
  const savedCount = useRef(0);
  useEffect(() => {
    if (state.results.length === savedCount.current) {
      return;
    }
    savedCount.current = state.results.length;
    const index = state.results.length - 1;
    const reps = state.results[index];
    const duration = manager.timer.elapsedTime;
    totalSeconds.current += duration;
    manager.handleStopTracking();
    if (reps > 0) {
      savePushupSession({
        reps,
        duration_seconds: duration,
        mode: source.kind === 'program' ? 'program' : 'sets',
        workout_id: workoutId,
        set_index: index + 1,
        target_reps: plan.sets[index],
      })
        .then(() => queryClient.invalidateQueries({queryKey: queryKeys.pushup.all}))
        .catch(() => setSaveError(true));
    }
  }, [state.results, manager, plan.sets, source.kind, workoutId, queryClient]);

  // 프로그램: 운동이 끝나면 진행 상태 갱신 (한 번만)
  useEffect(() => {
    if (state.phase !== 'done' || source.kind !== 'program' || !programRow || programUpdated.current) {
      return;
    }
    programUpdated.current = true;
    const current = toProgramState(programRow);
    updateProgram.mutate({
      id: programRow.id,
      state: completeDay(current),
      completedDay: {week: current.week, day: current.day, reps: state.results, completed_at: new Date().toISOString()},
      existing: programRow.completed_days,
    });
  }, [state.phase, state.results, source.kind, programRow, updateProgram]);

  const handleStart = () => {
    setStartedAt.current = Date.now();
    session.start();
    manager.handleStartTracking();
  };

  const handleAbort = () => {
    Alert.alert('운동 그만두기', '지금까지 끝낸 세트는 기록에 남아요.', [
      {text: '취소', style: 'cancel'},
      {
        text: '그만두기',
        style: 'destructive',
        onPress: () => {
          manager.handleStopTracking();
          navigation.navigate('Tabs' as never);
        },
      },
    ]);
  };

  if (state.phase === 'done') {
    return (
      <WorkoutSummary
        plan={plan}
        results={state.results}
        totalSeconds={totalSeconds.current}
        doneLabel={source.kind === 'program' ? '프로그램으로' : '홈으로'}
        onDone={() =>
          source.kind === 'program' ? navigation.navigate('Program') : navigation.navigate('Tabs' as never)
        }
      />
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <WorkoutHeader setNumber={state.setIndex + 1} totalSets={plan.sets.length} target={target} />

        {state.phase === 'rest' ? (
          <RestTimer remaining={state.restRemaining} onSkip={session.skipRest} />
        ) : (
          <>
            <Count pushUpCount={manager.pushUpCount} isGoingDown={manager.isGoingDown} />
            <TimerContainer formattedTime={formatTime(manager.timer.elapsedTime)} />
            <Engagement show={state.phase === 'tracking'} pushUpCount={manager.pushUpCount} />
          </>
        )}

        {saveError && <Text style={styles.warning}>세트 저장에 실패했어요. 네트워크를 확인해 주세요.</Text>}

        <View style={styles.footer}>
          <Text style={styles.instructionText}>
            {state.phase === 'idle' && '기기를 얼굴과 마주보게 바닥에 두세요'}
          </Text>
          <View style={styles.buttonContainer}>
            {state.phase === 'idle' && (
              <CustomButton style={styles.button} title="시작하기" variant="start" onPress={handleStart} />
            )}
            {state.phase === 'tracking' && (
              <CustomButton style={styles.button} title="세트 종료" variant="stop" onPress={session.finishSet} />
            )}
          </View>
          <Text style={styles.abort} onPress={handleAbort}>운동 그만두기</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {flex: 1, backgroundColor: colors.backgroundDark},
  container: {flex: 1, alignItems: 'center', padding: 20},
  warning: {fontSize: 13, color: colors.error, marginTop: 8},
  footer: {marginTop: 'auto', width: '100%', alignItems: 'center', gap: 16},
  instructionText: {fontSize: 16, textAlign: 'center', opacity: 0.8, color: colors.gray700, minHeight: 20},
  buttonContainer: {flexDirection: 'row', width: '100%', justifyContent: 'center'},
  button: {flex: 1, backgroundColor: colors.primaryDark},
  abort: {fontSize: 14, color: colors.gray400, padding: 8},
});

export default WorkoutScreen;
```

주의: `usePushUpManager` 의 `handleStartTracking` 은 카운트를 0 으로 리셋하고 타이머를 새로 시작하므로 세트마다 호출해도 된다. `session.count(manager.pushUpCount)` 는 `phase !== 'tracking'` 이면 리듀서가 무시한다.

- [ ] **Step 3: tsc/eslint 확인 후 커밋**

Run: `npx tsc --noEmit -p tsconfig.json && npx eslint src`
Expected: 오류 0

```bash
git add src/screens/WorkoutScreen.tsx src/components/features/workout
git commit -m "feat: 세트/프로그램 공용 운동 화면 추가"
```

---

### Task 9: 100개 만들기 화면

**Files:**
- Modify: `src/screens/ProgramScreen.tsx` (스텁 → 구현)

**Interfaces:**
- Consumes: `activeProgramQueryOptions`, `useCreateProgramMutation`, `useUpdateProgramMutation`, `useAbandonProgramMutation` (Task 4); `startProgram`, `applyTest`, `todayPlan`, `describeSets`, `toProgramState` (Task 1/3)

- [ ] **Step 1: 구현**

```tsx
// src/screens/ProgramScreen.tsx
import React, {useEffect} from 'react';
import {Alert, SafeAreaView, ScrollView, StyleSheet, Text, View} from 'react-native';
import {RouteProp, useNavigation, useRoute} from '@react-navigation/native';
import {useQuery} from '@tanstack/react-query';
import Header from '../components/common/Header';
import CustomButton from '../components/common/CustomButton';
import {colors} from '../constants/colors';
import {useSession} from '../hooks/useSession';
import {AppStackParamList} from '../navigations/AppNavigation';
import {
  activeProgramQueryOptions, useAbandonProgramMutation, useCreateProgramMutation, useUpdateProgramMutation,
} from '../tanstack-query';
import {toProgramState} from '../remote/program';
import {applyTest, describeSets, startProgram, todayPlan} from '../domain/hundredPushups';

function ProgramScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<AppStackParamList, 'Program'>>();
  const testReps = route.params?.testReps;
  const {user} = useSession();

  const {data: programRow, isLoading} = useQuery(activeProgramQueryOptions(user?.id ?? ''));
  const createProgram = useCreateProgramMutation();
  const updateProgram = useUpdateProgramMutation();
  const abandonProgram = useAbandonProgramMutation();

  // 챌린지 화면(테스트)에서 돌아온 결과 반영
  useEffect(() => {
    if (testReps === undefined || isLoading || !user) {
      return;
    }
    navigation.setParams({testReps: undefined} as never);
    if (!programRow) {
      createProgram.mutate({userId: user.id, state: startProgram(testReps)});
      return;
    }
    const state = toProgramState(programRow);
    if (state.testDue) {
      updateProgram.mutate({id: programRow.id, state: applyTest(state, testReps)});
    }
  }, [testReps, isLoading, programRow, user, navigation, createProgram, updateProgram]);

  const goTest = () => navigation.navigate('Challenge', {purpose: 'program-test'});

  const handleAbandon = () => {
    if (!programRow) {
      return;
    }
    Alert.alert('프로그램 그만두기', '진행 상황이 사라져요. 다시 시작하면 초기 테스트부터예요.', [
      {text: '취소', style: 'cancel'},
      {text: '그만두기', style: 'destructive', onPress: () => abandonProgram.mutate(programRow.id)},
    ]);
  };

  const renderBody = () => {
    if (isLoading) {
      return null;
    }
    if (!programRow) {
      return (
        <View style={styles.card}>
          <Text style={styles.heading}>6주 뒤, 연속 100개</Text>
          <Text style={styles.body}>주 3일, 하루 5세트.{'\n'}오늘 할 세트는 앱이 정해줘요.{'\n'}먼저 지금 몇 개까지 되는지 테스트해요.</Text>
          <CustomButton title="초기 테스트 시작" variant="start" style={styles.button} onPress={goTest} />
        </View>
      );
    }
    const state = toProgramState(programRow);
    if (state.status === 'completed') {
      return (
        <View style={styles.card}>
          <Text style={styles.heading}>100개 달성</Text>
          <Text style={styles.body}>최종 테스트 {state.lastTestReps}회. 프로그램을 끝냈어요.</Text>
          <CustomButton title="다시 시작" variant="start" style={styles.button} onPress={() => abandonProgram.mutate(programRow.id)} />
        </View>
      );
    }
    if (state.testDue) {
      const isFinal = state.week === 6;
      return (
        <View style={styles.card}>
          <Text style={styles.heading}>{isFinal ? '최종 테스트' : `${state.week}주차 테스트`}</Text>
          <Text style={styles.body}>
            {isFinal ? '연속으로 몇 개까지 되는지 재요. 100개면 완료예요.' : '결과에 따라 다음 주차의 세트가 정해져요.'}
          </Text>
          <CustomButton title="최대 횟수 테스트" variant="start" style={styles.button} onPress={goTest} />
        </View>
      );
    }
    const plan = todayPlan(state);
    return (
      <View style={styles.card}>
        <Text style={styles.heading}>{state.week}주차 · Day {state.day}</Text>
        <Text style={styles.sets}>{describeSets(plan.sets, plan.lastIsMax)}</Text>
        <Text style={styles.body}>세트 사이 휴식 {plan.restSeconds}초 · 마지막 세트는 가능한 만큼</Text>
        <Text style={styles.hint}>하루 쉬고 다음 운동을 권장해요</Text>
        <CustomButton
          title="오늘 운동 시작"
          variant="start"
          style={styles.button}
          onPress={() => navigation.navigate('Workout', {plan, source: {kind: 'program', programId: programRow.id}})}
        />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header title="100개 만들기" onBackPress={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content}>
        {renderBody()}
        {programRow && programRow.status === 'active' && (
          <Text style={styles.abandon} onPress={handleAbandon}>그만두기</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.backgroundDark},
  content: {padding: 20, gap: 24},
  card: {backgroundColor: colors.overlayLight, borderRadius: 16, padding: 24, gap: 12},
  heading: {fontSize: 22, fontWeight: '600', color: colors.textLight},
  sets: {fontSize: 28, fontWeight: 'bold', color: colors.textLight, marginVertical: 4},
  body: {fontSize: 15, lineHeight: 22, color: colors.textSecondary},
  hint: {fontSize: 13, color: colors.gray400},
  button: {marginTop: 8},
  abandon: {textAlign: 'center', fontSize: 14, color: colors.gray400, padding: 8},
});

export default ProgramScreen;
```

- [ ] **Step 2: tsc/eslint 확인 후 커밋**

Run: `npx tsc --noEmit -p tsconfig.json && npx eslint src`
Expected: 오류 0

```bash
git add src/screens/ProgramScreen.tsx
git commit -m "feat: 100개 만들기 프로그램 화면 추가"
```

---

### Task 10: 히스토리 세트 카드 목표 표시 + SQL + 문서 + 최종 검증

**Files:**
- Modify: `src/components/features/push-up/SetCard.tsx` (`target` 옵션), `src/screens/HistoryScreen.tsx` (`target_reps` 전달)
- Create: `WORKOUT_MODES.sql`
- Modify: `docs/superpowers/specs/2026-08-30-workout-modes-design.md` 상태 → "구현됨"

- [ ] **Step 1: SetCard 에 목표 표시**

`SetCard.tsx` 의 `SetData` 에 `target?: number | null` 추가, 횟수 표시를:

```tsx
          <Text style={styles.setReps}>
            {set.reps}회{set.target ? <Text style={styles.setTarget}> / {set.target}</Text> : null}
          </Text>
```

스타일 추가: `setTarget: {fontSize: 13, fontWeight: '400', color: colors.gray400}`.

`HistoryScreen.tsx` 의 `SetCard` 호출에 `target: set.target_reps,` 를 `set` 객체에 추가.

- [ ] **Step 2: SQL 파일**

```sql
-- WORKOUT_MODES.sql
-- 운동 모드(세트 / 100개 만들기) 도입용 DB 변경. Supabase SQL Editor 에서 실행.
-- 구버전 앱 호환: 전부 기본값/nullable.

ALTER TABLE pushup_sets
  ADD COLUMN IF NOT EXISTS mode        text NOT NULL DEFAULT 'challenge',
  ADD COLUMN IF NOT EXISTS workout_id  uuid,
  ADD COLUMN IF NOT EXISTS set_index   int,
  ADD COLUMN IF NOT EXISTS target_reps int;

CREATE TABLE IF NOT EXISTS pushup_programs (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status         text NOT NULL DEFAULT 'active',
  week           int  NOT NULL DEFAULT 1,
  day            int  NOT NULL DEFAULT 1,
  level          int  NOT NULL,
  last_test_reps int  NOT NULL,
  test_due       boolean NOT NULL DEFAULT false,
  completed_days jsonb NOT NULL DEFAULT '[]',
  created_at     timestamptz DEFAULT now(),
  updated_at     timestamptz DEFAULT now()
);

ALTER TABLE pushup_programs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own programs" ON pushup_programs;
CREATE POLICY "own programs" ON pushup_programs
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS pushup_programs_user_active
  ON pushup_programs (user_id) WHERE status = 'active';
```

- [ ] **Step 3: 전체 검증**

Run:
```bash
npx jest __tests__/domain __tests__/hooks __tests__/remote __tests__/utils
npx tsc --noEmit -p tsconfig.json
npx eslint src __tests__
```
Expected: 전부 통과 / 오류 0

- [ ] **Step 4: 커밋**

```bash
git add src/components/features/push-up/SetCard.tsx src/screens/HistoryScreen.tsx WORKOUT_MODES.sql docs/superpowers
git commit -m "feat: 히스토리에 세트 목표 표시, 운동 모드 DB 마이그레이션 SQL 추가"
```

- [ ] **Step 5: 사용자에게 인계**

`WORKOUT_MODES.sql` 실행 안내 + 실기기 확인 항목(홈 3카드 / 세트 3×10 자동 종료·휴식 / 프로그램 초기 테스트 → Day 1 → 완료 → Day 2) 을 전달한다.
