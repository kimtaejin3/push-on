# 100개 챌린지 UX 개선 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 100개 챌린지가 "못 채우면 넘어가지 않고, 두 번 연속 실패하면 하향을 권하고, 주차를 직접 고를 수 있고, 모든 변화의 이유를 그 자리에서 말해주도록" 만들고 흐름 버그 3건을 고친다.

**Architecture:** 판정·전이·문구 분기는 전부 순수 함수(`src/domain/*`)에 두고 Jest 로 검증한다. 시도 기록은 기존 `completed_days`(jsonb)에 `passed` 와 함께 덧붙이고, 연속 실패는 그 배열에서 계산한다(스키마 변경 없음). 화면은 도메인 함수 결과를 그리기만 하고, 프로그램 저장은 TanStack Query 뮤테이션의 pending/error 를 화면에 드러낸다.

**Tech Stack:** React Native 0.79, React Navigation 7 (native-stack), TanStack Query v5, Supabase, Jest.

**Spec:** `docs/superpowers/specs/2026-11-21-hundred-challenge-ux-design.md` — 화면 문구·스케치는 스펙 4장을 그대로 따른다. 이 계획은 문구를 다시 적지 않는다.

## Global Constraints

- DB 스키마를 바꾸지 않는다. SQL 수동 실행이 필요한 변경은 금지.
- 구버전 앱이 같은 DB 를 쓴다: `status = 'active'` 한 건만 읽고 `completed_days` 에 덧붙이기만 한다. `passed` 가 없는 기록은 통과로 본다.
- 통과 = 모든 세트가 목표 이상(마지막 세트는 최소치 이상). 하향 권유 기준 = 같은 (주차, Day, 레벨) 연속 실패 **2회 이상**.
- 세트 실패로 인한 하향은 사용자가 버튼을 눌러야만 일어난다. 테스트 결과로 인한 레벨 변화는 기존 규칙(`applyTest`, `retestLevel`) 그대로 자동.
- 테스트 통과 기준: 2주차 끝 16개, 4주차 끝 31개, 5주차 끝 46개, 최종 100개.
- 안내 문구는 "사실 + 이유 + 다음에 할 일". 꾸중하는 표현 금지. 스펙 4장의 정보가 빠지면 안 된다.
- 세트 모드(`source.kind === 'sets'`)는 휴식 화면 표시와 뒤로가기 수정 외에 동작을 바꾸지 않는다.
- 화면 테스트 인프라가 없다(`__tests__/App.test.tsx` 는 원래 깨져 있음). 화면 작업은 타입체크·린트·수동 확인으로 검증한다.
- 검증 명령: `npx jest __tests__/domain __tests__/remote __tests__/hooks`, `npx tsc --noEmit -p tsconfig.json`, `npx eslint src __tests__` (셋 다 출력·실패 없이 끝나야 함. 시작 시점 기준 전부 통과).
- 테스트의 supabase 목은 `jest.mock('../../src/lib/supabase', factory)` 패턴을 쓴다.
- main 에 직접 커밋한다. 메시지는 한국어, 끝에 `Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>`. push 는 하지 않는다.

## Review Focus

- **예전 기록**: `completed_days` 에 `passed`·`level`·`targets` 가 없는 기록이 섞여 있다. 통과로 세고 연속 실패를 끊어야 한다 → Task 1.
- **세트 결과가 목표보다 짧은 배열**: 빠진 세트는 0개로 보고 실패 처리해야 한다 → Task 1.
- **조회 전·조회 실패 상태**: 프로그램이 "없는 것"으로 보이면 소개 화면이 뜨고 중복 프로그램이 만들어진다. 로딩/오류는 "없음"과 구분해야 한다 → Task 2 (`resolveProgramView`).
- **저장 버튼 연타·재시도**: 같은 시도가 두 번 기록되면 한 번 실패로 하향 권유가 뜬다. 한 운동은 기록 1건이어야 한다 → Task 6 (수동 확인 항목).
- **낡은 `completed_days` 로 덮어쓰기**: 기록 저장 직후 캐시가 갱신되기 전에 하향을 누르면 방금 기록이 사라진다. 저장 성공 시 캐시를 즉시 갱신해야 한다 → Task 3.

---

## File Structure

| 파일 | 책임 |
|---|---|
| `src/domain/hundredPushups.ts` (수정) | 통과 판정, 연속 실패, 하향·주차 이동, 레벨 범위, 테스트 기준, 테스트 결과 해석 |
| `src/domain/programMessages.ts` (신규) | 분기가 있는 안내 문구 (테스트 결과, 다음 단계, 이동 안내) |
| `src/domain/programView.ts` (신규) | 조회 상태 + 프로그램 행 → 화면 상태 |
| `src/remote/program.ts` (수정) | 최신 프로그램 조회 |
| `src/tanstack-query/*` (수정) | 쿼리 키·옵션 이름 변경, 뮤테이션 성공 시 캐시 갱신 |
| `src/components/features/program/ProgramTestResult.tsx` (신규) | 테스트 결과 해석 + 프로그램 반영 + 저장 실패 재시도 |
| `src/components/features/program/ProgramDaySummary.tsx` (신규) | 프로그램 운동 요약 (판정·세트별 결과·다음 할 일·하향 권유) |
| `src/components/features/program/ProgramTodayCard.tsx` / `ProgramTestCard.tsx` / `ProgramCompletedCard.tsx` (신규) | 프로그램 화면의 상태별 카드 |
| `src/components/features/workout/RestTimer.tsx` (수정) | 방금 세트 결과 + 다음 세트 정보 |
| `src/screens/*` (수정) | ChallengeScreen, WorkoutScreen, ProgramScreen, ProgramTableScreen, HomeScreen |

---

### Task 1: 도메인 — 통과 판정 · 연속 실패 · 이동

**Files:**
- Modify: `src/domain/hundredPushups.ts`
- Test: `__tests__/domain/hundredPushups.test.ts`

**Interfaces:**
- Produces:

```ts
export type ProgramRecord = {
  week: number; day: number; reps: number[]; completed_at: string;
  level?: Level; targets?: number[];
  passed?: boolean;   // 없으면(예전 기록) 통과
  kind?: 'move';      // 하향·주차 변경 표시. 시도가 아님
};
export type Position = {week: number; day: number; level: Level};
export type MissedSet = {set: number; reps: number; target: number; short: number}; // set 은 1부터
export const DOWNGRADE_AFTER = 2;
export const isDayPassed: (targets: number[], reps: number[]) => boolean;
export const missedSets: (targets: number[], reps: number[]) => MissedSet[];
export const attemptRecord: (state: ProgramState, targets: number[], reps: number[], at: string) => ProgramRecord;
export const moveRecord: (state: ProgramState, at: string) => ProgramRecord; // 이동 "후" 상태를 받는다
export const failStreak: (records: ProgramRecord[], state: ProgramState) => number;
export const lastFailure: (records: ProgramRecord[], state: ProgramState) => ProgramRecord | null;
export const passedDayCount: (records: ProgramRecord[]) => number;
export const downgradeTarget: (state: ProgramState) => Position | null;
export const moveTo: (state: ProgramState, to: Position) => ProgramState;
export const levelRange: (week: number, level: Level) => {min: number; max: number | null};
export const testThreshold: (week: number) => number | null;
```

- [ ] **Step 1: 실패하는 테스트 작성** — `__tests__/domain/hundredPushups.test.ts` 에 추가 (import 목록에 새 이름들 추가)

```ts
const pos = (week: number, day: number, level: 1 | 2 | 3) =>
  ({week, day, level, lastTestReps: 12, testDue: false, status: 'active' as const});
const at = '2026-11-19T10:00:00.000Z';
const fail = (s: ReturnType<typeof pos>) => attemptRecord(s, [14, 16, 12, 12, 17], [14, 13, 12, 10, 17], at);
const pass = (s: ReturnType<typeof pos>) => attemptRecord(s, [14, 16, 12, 12, 17], [14, 16, 12, 12, 19], at);

describe('isDayPassed / missedSets', () => {
  it('모든 세트가 목표 이상이어야 통과', () => {
    expect(isDayPassed([6, 6, 4, 4, 5], [6, 6, 4, 4, 5])).toBe(true);
    expect(isDayPassed([6, 6, 4, 4, 5], [6, 6, 4, 4, 9])).toBe(true);
    expect(isDayPassed([6, 6, 4, 4, 5], [6, 5, 4, 4, 30])).toBe(false); // 합계가 넘어도 한 세트 미달이면 실패
  });
  it('결과가 짧으면 빠진 세트는 0개로 본다', () => {
    expect(isDayPassed([6, 6, 4], [6, 6])).toBe(false);
    expect(missedSets([6, 6, 4], [6, 6])).toEqual([{set: 3, reps: 0, target: 4, short: 4}]);
  });
  it('못 채운 세트만 1부터 번호로 돌려준다', () => {
    expect(missedSets([14, 16, 12, 12, 17], [14, 13, 12, 10, 17])).toEqual([
      {set: 2, reps: 13, target: 16, short: 3},
      {set: 4, reps: 10, target: 12, short: 2},
    ]);
  });
});

describe('attemptRecord / moveRecord', () => {
  it('시도 기록은 위치·목표·결과·통과 여부를 담는다', () => {
    expect(fail(pos(2, 2, 3))).toEqual({
      week: 2, day: 2, level: 3, targets: [14, 16, 12, 12, 17], reps: [14, 13, 12, 10, 17], passed: false, completed_at: at,
    });
    expect(pass(pos(2, 2, 3)).passed).toBe(true);
  });
  it('이동 표시는 kind: move 이고 reps 가 비어 있다', () => {
    expect(moveRecord(pos(2, 2, 2), at)).toEqual({kind: 'move', week: 2, day: 2, level: 2, reps: [], completed_at: at});
  });
});

describe('failStreak / lastFailure / passedDayCount', () => {
  const s = pos(2, 2, 3);
  it('현재 위치의 실패가 끝에서부터 이어진 개수', () => {
    expect(failStreak([], s)).toBe(0);
    expect(failStreak([fail(s)], s)).toBe(1);
    expect(failStreak([pass(pos(2, 1, 3)), fail(s), fail(s)], s)).toBe(2);
  });
  it('통과·다른 위치·이동 표시·예전 기록이 끼면 끊긴다', () => {
    expect(failStreak([fail(s), pass(s)], s)).toBe(0);
    expect(failStreak([fail(s), fail(pos(2, 2, 2))], s)).toBe(0);
    expect(failStreak([fail(s), fail(s), moveRecord(s, at)], s)).toBe(0);
    const legacy = {week: 2, day: 2, reps: [1, 1, 1, 1, 1], completed_at: at}; // passed 없음 = 통과
    expect(failStreak([fail(s), legacy], s)).toBe(0);
  });
  it('lastFailure 는 마지막 기록이 현재 위치의 실패일 때만', () => {
    expect(lastFailure([pass(pos(2, 1, 3)), fail(s)], s)).toEqual(fail(s));
    expect(lastFailure([fail(s), moveRecord(s, at)], s)).toBeNull();
    expect(lastFailure([fail(pos(2, 1, 3))], s)).toBeNull();
    expect(lastFailure([], s)).toBeNull();
  });
  it('passedDayCount 는 통과한 시도만 센다 (예전 기록 포함, 실패·이동 제외)', () => {
    const legacy = {week: 1, day: 1, reps: [6, 6, 4, 4, 5], completed_at: at};
    expect(passedDayCount([legacy, pass(s), fail(s), moveRecord(s, at)])).toBe(2);
  });
});

describe('downgradeTarget / moveTo', () => {
  it('레벨 2·3 은 같은 주차·Day 의 한 레벨 아래', () => {
    expect(downgradeTarget(pos(2, 2, 3))).toEqual({week: 2, day: 2, level: 2});
    expect(downgradeTarget(pos(5, 3, 2))).toEqual({week: 5, day: 3, level: 1});
  });
  it('레벨 1 이고 2주차 이상이면 이전 주차 Day 1 레벨 1', () => {
    expect(downgradeTarget(pos(3, 2, 1))).toEqual({week: 2, day: 1, level: 1});
  });
  it('1주차 레벨 1 은 낮출 곳이 없다', () => {
    expect(downgradeTarget(pos(1, 3, 1))).toBeNull();
  });
  it('moveTo 는 위치를 바꾸고 테스트 차례를 푼다. 최근 테스트 기록은 유지', () => {
    const due = {...pos(2, 3, 2), testDue: true};
    expect(moveTo(due, {week: 4, day: 1, level: 2})).toEqual({...due, week: 4, day: 1, level: 2, testDue: false});
  });
  it('완료된 프로그램은 그대로 돌려준다', () => {
    const done = {...pos(6, 3, 3), status: 'completed' as const};
    expect(moveTo(done, {week: 1, day: 1, level: 1})).toBe(done);
  });
});

describe('levelRange / testThreshold', () => {
  it.each([
    [1, 1, 0, 5], [2, 2, 6, 10], [1, 3, 11, 20],
    [3, 1, 16, 20], [4, 2, 21, 25], [3, 3, 26, null],
    [5, 1, 31, 35], [5, 2, 36, 40], [5, 3, 41, null],
    [6, 1, 46, 50], [6, 2, 51, 60], [6, 3, 61, null],
  ])('%i주차 레벨 %i → %i ~ %s', (week, level, min, max) => {
    expect(levelRange(week, level as 1 | 2 | 3)).toEqual({min, max});
  });
  it('테스트 통과 기준', () => {
    expect([1, 2, 3, 4, 5, 6].map(testThreshold)).toEqual([null, 16, null, 31, 46, 100]);
  });
});
```

- [ ] **Step 2: 실패 확인** — `npx jest __tests__/domain/hundredPushups.test.ts` → 새 describe 들이 "is not a function" 으로 FAIL

- [ ] **Step 3: `src/domain/hundredPushups.ts` 에 구현**
  - `levelRange` 는 기존 `THRESHOLDS` 에서 계산한다. 1·2주차 레벨 3 의 `max` 는 20 (원본 표의 11~20), 그 외 레벨 3 은 `null`.
  - `testThreshold` 는 기존 `TEST_WEEKS`·`FINAL_GOAL`·`THRESHOLDS[week + 1][0]` 에서 계산한다.
  - `failStreak`·`lastFailure` 의 "현재 위치"는 `state.week/day/level` 과 기록의 `week/day/level` 이 모두 같은 것.
  - 기존 `dayAchievementRate`·`shouldSuggestRepeat` 는 이 단계에서 지우지 않는다 (Task 6 에서 제거).

- [ ] **Step 4: 통과 확인** — `npx jest __tests__/domain/hundredPushups.test.ts` → PASS

- [ ] **Step 5: 커밋** — `feat(program): 통과 판정·연속 실패·하향/주차 이동 규칙 추가`

---

### Task 2: 도메인 — 테스트 결과 해석 · 화면 상태 · 문구

**Files:**
- Modify: `src/domain/hundredPushups.ts`
- Create: `src/domain/programMessages.ts`, `src/domain/programView.ts`
- Test: `__tests__/domain/hundredPushups.test.ts`, `__tests__/domain/programMessages.test.ts`, `__tests__/domain/programView.test.ts`

**Interfaces:**
- Consumes: Task 1 의 `Position`, `testThreshold`, 기존 `startProgram`/`applyTest`/`retestLevel`/`completeDay`
- Produces:

```ts
// hundredPushups.ts
export type TestOutcome =
  | {kind: 'start'; week: number; level: Level}
  | {kind: 'advance'; week: number; level: Level}
  | {kind: 'repeat'; week: number; level: Level; prevLevel: Level; threshold: number; short: number}
  | {kind: 'finalMiss'; level: Level; prevLevel: Level; short: number}
  | {kind: 'completed'}
  | {kind: 'retest'; week: number; level: Level; prevLevel: Level};
/** state 가 null 이거나 completed 면 새로 시작, testDue 면 주차 테스트, 아니면 레벨 다시 재기 */
export const resolveTest: (state: ProgramState | null, reps: number) => {next: ProgramState; outcome: TestOutcome};

// programMessages.ts
export const testOutcomeMessage: (reps: number, outcome: TestOutcome) => {title: string; body: string};
export const nextStepLabel: (state: ProgramState) => string; // 이 날을 통과한 "뒤" 할 일: "2주차 Day 3" | "2주차 테스트"
export const downgradeNotice: (from: Position, to: Position) => string;
export const jumpNotice: (to: Position) => string;

// programView.ts
export type ProgramView = 'loading' | 'error' | 'none' | 'active' | 'testDue' | 'completed';
export const resolveProgramView: (q: {
  isPending: boolean; isError: boolean;
  data: {status: string; test_due: boolean} | null | undefined;
}) => ProgramView;
export const canStartNewProgram: (view: ProgramView) => boolean; // 'none' | 'completed' 만 true
```

- [ ] **Step 1: 실패하는 테스트 작성**

`__tests__/domain/hundredPushups.test.ts` 에 추가:

```ts
describe('resolveTest', () => {
  const s = (week: number, day: number, level: 1 | 2 | 3, testDue: boolean) =>
    ({week, day, level, lastTestReps: 0, testDue, status: 'active' as const});
  it('프로그램이 없으면 새로 시작', () => {
    const r = resolveTest(null, 8);
    expect(r.next).toEqual(startProgram(8));
    expect(r.outcome).toEqual({kind: 'start', week: 1, level: 2});
  });
  it('완료된 프로그램에서 재면 새로 시작', () => {
    const done = {...s(6, 3, 3, false), status: 'completed' as const};
    expect(resolveTest(done, 23).outcome).toEqual({kind: 'start', week: 3, level: 2});
  });
  it('주차 테스트 통과 → advance', () => {
    const r = resolveTest(s(2, 3, 1, true), 23);
    expect(r.next).toMatchObject({week: 3, day: 1, level: 2});
    expect(r.outcome).toEqual({kind: 'advance', week: 3, level: 2});
  });
  it('주차 테스트 미달 → repeat (기준·부족 개수·레벨 변화 포함)', () => {
    expect(resolveTest(s(2, 3, 2, true), 14).outcome)
      .toEqual({kind: 'repeat', week: 2, level: 3, prevLevel: 2, threshold: 16, short: 2});
    expect(resolveTest(s(2, 3, 3, true), 8).outcome)
      .toEqual({kind: 'repeat', week: 2, level: 2, prevLevel: 3, threshold: 16, short: 8});
  });
  it('최종 테스트 미달 → finalMiss, 100개 이상 → completed', () => {
    expect(resolveTest(s(6, 3, 3, true), 87).outcome).toEqual({kind: 'finalMiss', level: 3, prevLevel: 3, short: 13});
    const r = resolveTest(s(6, 3, 3, true), 100);
    expect(r.outcome).toEqual({kind: 'completed'});
    expect(r.next.status).toBe('completed');
  });
  it('테스트 차례가 아니면 레벨 다시 재기', () => {
    const r = resolveTest(s(3, 2, 3, false), 17);
    expect(r.next).toMatchObject({week: 3, day: 2, level: 1, lastTestReps: 17});
    expect(r.outcome).toEqual({kind: 'retest', week: 3, level: 1, prevLevel: 3});
  });
});
```

`__tests__/domain/programMessages.test.ts`:

```ts
import {testOutcomeMessage, nextStepLabel, downgradeNotice, jumpNotice} from '../../src/domain/programMessages';

const body = (reps: number, o: Parameters<typeof testOutcomeMessage>[1]) => testOutcomeMessage(reps, o).body;

describe('testOutcomeMessage', () => {
  it('제목은 횟수', () => {
    expect(testOutcomeMessage(8, {kind: 'start', week: 1, level: 2}).title).toBe('8개');
  });
  it('시작 / 다음 주차', () => {
    expect(body(8, {kind: 'start', week: 1, level: 2})).toBe('1주차 레벨 2로 시작해요');
    expect(body(23, {kind: 'advance', week: 3, level: 2})).toBe('3주차 레벨 2로 넘어가요');
  });
  it('기준 미달은 기준·부족 개수·반복할 주차를 말한다', () => {
    expect(body(14, {kind: 'repeat', week: 2, level: 2, prevLevel: 2, threshold: 16, short: 2}))
      .toBe('3주차 기준(16개)에 2개 부족해요. 2주차를 한 번 더 하고 다시 재요');
  });
  it('반복하면서 레벨이 바뀌면 그 사실을 덧붙인다', () => {
    expect(body(8, {kind: 'repeat', week: 2, level: 2, prevLevel: 3, threshold: 16, short: 8}))
      .toBe('3주차 기준(16개)에 8개 부족해요. 2주차를 한 번 더 하고 다시 재요. 이번 결과에 맞춰 레벨도 3 → 2로 조정했어요');
  });
  it('최종 미달', () => {
    expect(body(87, {kind: 'finalMiss', level: 3, prevLevel: 3, short: 13}))
      .toBe('100개까지 13개 남았어요. 6주차를 한 번 더 해요');
    expect(body(48, {kind: 'finalMiss', level: 1, prevLevel: 3, short: 52}))
      .toBe('100개까지 52개 남았어요. 6주차를 한 번 더 해요. 이번 결과에 맞춰 레벨도 3 → 1로 조정했어요');
  });
  it('완료', () => {
    expect(body(100, {kind: 'completed'})).toBe('연속 100개를 해냈어요');
  });
  it('레벨 다시 재기: 오름 / 내림 / 그대로', () => {
    expect(body(15, {kind: 'retest', week: 2, level: 3, prevLevel: 2})).toBe('이번 주 레벨이 2 → 3으로 바뀌어요');
    expect(body(17, {kind: 'retest', week: 3, level: 1, prevLevel: 3}))
      .toBe('이번 주 레벨이 3 → 1로 내려가요. 지금 기록에 맞는 세트로 바뀌어요');
    expect(body(8, {kind: 'retest', week: 1, level: 2, prevLevel: 2})).toBe('레벨은 그대로 2예요');
  });
});

describe('nextStepLabel', () => {
  const s = (week: number, day: number) => ({week, day, level: 1 as const, lastTestReps: 0, testDue: false, status: 'active' as const});
  it('통과한 뒤 할 일을 말한다', () => {
    expect(nextStepLabel(s(2, 2))).toBe('2주차 Day 3');
    expect(nextStepLabel(s(1, 3))).toBe('2주차 Day 1');
    expect(nextStepLabel(s(2, 3))).toBe('2주차 테스트');
    expect(nextStepLabel(s(6, 3))).toBe('최종 테스트');
  });
});

describe('downgradeNotice / jumpNotice', () => {
  it('같은 주차에서 레벨만 낮춘 경우', () => {
    expect(downgradeNotice({week: 2, day: 2, level: 3}, {week: 2, day: 2, level: 2}))
      .toBe('레벨 3 → 2로 낮췄어요. 오늘 세트가 바뀌었어요');
  });
  it('이전 주차로 돌아간 경우', () => {
    expect(downgradeNotice({week: 3, day: 2, level: 1}, {week: 2, day: 1, level: 1}))
      .toBe('2주차 Day 1부터 다시 해요. 3주차는 조금 뒤에 다시 도전해요');
  });
  it('주차를 직접 고른 경우', () => {
    expect(jumpNotice({week: 4, day: 1, level: 2})).toBe('4주차 · 레벨 2 · Day 1부터 다시 진행해요');
  });
});
```

`__tests__/domain/programView.test.ts`:

```ts
import {resolveProgramView, canStartNewProgram} from '../../src/domain/programView';

const row = (status: string, test_due = false) => ({status, test_due});

describe('resolveProgramView', () => {
  it('조회 전에는 loading, 실패하면 error — 둘 다 none 이 아니다', () => {
    expect(resolveProgramView({isPending: true, isError: false, data: undefined})).toBe('loading');
    expect(resolveProgramView({isPending: false, isError: true, data: undefined})).toBe('error');
  });
  it('조회에 성공했고 행이 없으면 none', () => {
    expect(resolveProgramView({isPending: false, isError: false, data: null})).toBe('none');
  });
  it('행의 상태에 따라 active / testDue / completed', () => {
    expect(resolveProgramView({isPending: false, isError: false, data: row('active')})).toBe('active');
    expect(resolveProgramView({isPending: false, isError: false, data: row('active', true)})).toBe('testDue');
    expect(resolveProgramView({isPending: false, isError: false, data: row('completed', true)})).toBe('completed');
  });
  it('그만둔 프로그램은 none', () => {
    expect(resolveProgramView({isPending: false, isError: false, data: row('abandoned')})).toBe('none');
  });
  it('캐시된 행이 있으면 재조회가 실패해도 그 행을 쓴다', () => {
    expect(resolveProgramView({isPending: false, isError: true, data: row('active')})).toBe('active');
  });
});

describe('canStartNewProgram', () => {
  it('없음·완료일 때만 새로 만들 수 있다', () => {
    expect((['loading', 'error', 'none', 'active', 'testDue', 'completed'] as const).map(canStartNewProgram))
      .toEqual([false, false, true, false, false, true]);
  });
});
```

- [ ] **Step 2: 실패 확인** — `npx jest __tests__/domain` → 새 테스트 FAIL

- [ ] **Step 3: 구현** — `resolveTest` 는 기존 `startProgram`/`applyTest`/`retestLevel` 을 호출하고 그 결과를 비교해 `outcome` 을 만든다. `repeat.threshold` 는 `testThreshold(state.week)`. 조사 "(으)로"는 레벨 3일 때만 "으로".

- [ ] **Step 4: 통과 확인** — `npx jest __tests__/domain` → PASS

- [ ] **Step 5: 커밋** — `feat(program): 테스트 결과 해석·화면 상태·안내 문구 도메인 추가`

---

### Task 3: 데이터 — 최신 프로그램 조회와 캐시 갱신

**Files:**
- Modify: `src/remote/program.ts`, `src/tanstack-query/queryKeys.ts`, `src/tanstack-query/queryOptions/program.ts`, `src/tanstack-query/mutationHooks/program.ts`
- Modify (이름 변경만): `src/screens/HomeScreen.tsx`, `ProgramScreen.tsx`, `ProgramTableScreen.tsx`, `WorkoutScreen.tsx`
- Test: `__tests__/remote/program.test.ts`, `__tests__/hooks/useProgramMutations.test.tsx`

**Interfaces:**
- Consumes: Task 1 의 `ProgramRecord`
- Produces:

```ts
// remote/program.ts
export type CompletedDay = ProgramRecord;                 // 기존 인터페이스를 대체
export const getCurrentProgram: (userId: string) => Promise<ProgramRow | null>; // getActiveProgram 을 대체
// queryKeys.program.current = ['program', 'current']     // program.active 를 대체
export const currentProgramQueryOptions: (userId: string) => {...}; // activeProgramQueryOptions 를 대체
// 뮤테이션 훅 이름·인자는 그대로. 성공 시 캐시를 즉시 갱신한다.
```

- [ ] **Step 1: 실패하는 테스트 작성**

`__tests__/remote/program.test.ts` 의 `getActiveProgram` 테스트를 교체:

```ts
it('getCurrentProgram 은 가장 최근에 만든 프로그램 한 건을 돌려준다', async () => {
  const maybeSingle = jest.fn().mockResolvedValue({data: row, error: null});
  const limit = jest.fn(() => ({maybeSingle}));
  const order = jest.fn(() => ({limit}));
  const eq = jest.fn(() => ({order}));
  mockFrom.mockReturnValue({select: () => ({eq})});
  await expect(getCurrentProgram('u1')).resolves.toEqual(row);
  expect(eq).toHaveBeenCalledWith('user_id', 'u1');
  expect(order).toHaveBeenCalledWith('created_at', {ascending: false});
  expect(limit).toHaveBeenCalledWith(1);

  maybeSingle.mockResolvedValue({data: {...row, status: 'completed'}, error: null});
  await expect(getCurrentProgram('u1')).resolves.toMatchObject({status: 'completed'});
  maybeSingle.mockResolvedValue({data: {...row, status: 'abandoned'}, error: null});
  await expect(getCurrentProgram('u1')).resolves.toBeNull(); // 최신이 그만둔 것이면 없는 것
  maybeSingle.mockResolvedValue({data: null, error: null});
  await expect(getCurrentProgram('u1')).resolves.toBeNull();
});
```

`__tests__/hooks/useProgramMutations.test.tsx` (기존 훅 테스트의 `Probe` + `react-test-renderer` 패턴, `QueryClientProvider` 로 감싼다. `src/remote/program` 을 `jest.mock` 한다):

```tsx
it('updateProgram 성공 시 돌려받은 행으로 캐시를 즉시 바꾼다', async () => {
  // queryClient.setQueryData(queryKeys.program.current, oldRow) 후 mutate
  // mockUpdate.mockResolvedValue(newRow)
  expect(queryClient.getQueryData(queryKeys.program.current)).toEqual(newRow);
});
it('createProgram 성공 시에도 캐시에 새 행이 들어간다', async () => {
  expect(queryClient.getQueryData(queryKeys.program.current)).toEqual(newRow);
});
it('abandonProgram 성공 시 캐시가 null 이 된다', async () => {
  expect(queryClient.getQueryData(queryKeys.program.current)).toBeNull();
});
```

- [ ] **Step 2: 실패 확인** — `npx jest __tests__/remote/program.test.ts __tests__/hooks/useProgramMutations.test.tsx` → FAIL

- [ ] **Step 3: 구현**
  - `getCurrentProgram`: `user_id` 로 거르고 `created_at` 내림차순 1건. `status === 'abandoned'` 면 `null`.
  - 뮤테이션 `onSuccess`: `setQueryData(queryKeys.program.current, row | null)` 후 기존대로 invalidate. `onError` 의 `console.error` 는 유지 (화면 표시는 뒤 Task).
  - 네 화면의 `activeProgramQueryOptions` → `currentProgramQueryOptions` 로 이름만 바꾼다. 동작은 이 Task 에서 바꾸지 않는다.

- [ ] **Step 4: 통과 확인** — 위 jest 명령 PASS, `npx tsc --noEmit -p tsconfig.json` 출력 없음

- [ ] **Step 5: 커밋** — `fix(program): 최신 프로그램 조회로 바꾸고 저장 성공 시 캐시 즉시 갱신`

---

### Task 4: 뒤로가기 — 화면이 쌓이지 않게, 운동 중 이탈은 확인 후

**Files:**
- Modify: `src/screens/WorkoutScreen.tsx`, `src/components/features/push-up/ChallengeResult.tsx`, `src/hooks/usePushUpManager.ts`

**Interfaces:**
- Consumes: 없음
- Produces: 이후 Task 는 프로그램·홈으로 돌아갈 때 `navigation.popTo(...)` 를 쓴다. `navigation.navigate('Program' | 'Tabs')` 로 돌아가는 코드는 남기지 않는다.

- [ ] **Step 1: `navigate` → `popTo`** — `WorkoutScreen.tsx` 와 `ChallengeResult.tsx` 에서 `Program`·`Tabs` 로 돌아가는 `navigation.navigate(...)` 6곳을 `navigation.popTo(...)` 로 바꾼다 (React Navigation 7 의 `navigate` 는 기존 화면으로 돌아가지 않고 새로 쌓는다). `Program` 으로 넘기던 `testReps` 파라미터는 그대로 유지한다 (Task 5 에서 제거).

- [ ] **Step 2: 운동 중 이탈 확인** — `WorkoutScreen` 에 `usePreventRemove(state.phase !== 'done', ...)` (`@react-navigation/native`) 를 건다. 콜백에서 기존 "운동 그만두기" `Alert` 를 띄우고, "그만두기"를 누르면 `manager.handleStopTracking()` 후 `navigation.dispatch(data.action)`. 화면의 "운동 그만두기" 텍스트는 `Alert` 를 직접 띄우지 않고 `navigation.popTo(source.kind === 'program' ? 'Program' : 'Tabs')` 만 호출한다 (확인창은 위 콜백 한 곳에서만). 프로그램 운동이면 확인창 본문에 "오늘 운동은 처음부터 다시 해야 해요"를 덧붙인다.

- [ ] **Step 3: 화면을 떠날 때 세션 정지** — `usePushUpManager` 에 언마운트 정리를 추가한다: 추적 중이었다면 `PushupManager.stopPushupSession()` 호출.

- [ ] **Step 4: 검증** — `npx tsc --noEmit -p tsconfig.json`, `npx eslint src __tests__` 출력 없음. `grep -rn "navigate('Program'\|navigate('Tabs'" src/screens/WorkoutScreen.tsx src/components/features/push-up` 결과 없음.

- [ ] **Step 5: 커밋** — `fix(nav): 운동·테스트 후 화면이 쌓이지 않게 하고 운동 중 이탈은 확인 후 진행`

---

### Task 5: 테스트 흐름 — 결과 해석과 저장 실패 안내

**Files:**
- Create: `src/components/features/program/ProgramTestResult.tsx`
- Modify: `src/screens/ChallengeScreen.tsx`, `src/components/features/push-up/ChallengeResult.tsx`, `src/screens/ProgramScreen.tsx`, `src/navigations/AppNavigation.tsx`

**Interfaces:**
- Consumes: `resolveTest`, `testOutcomeMessage`, `resolveProgramView`, `canStartNewProgram`, `todayPlan`, `describeSets`, `currentProgramQueryOptions`, `useCreateProgramMutation`, `useUpdateProgramMutation`, `savePushupSession`
- Produces:

```ts
// ProgramTestResult.tsx
function ProgramTestResult(props: {reps: number; duration: number}): React.JSX.Element;
// AppNavigation.tsx
Program: {notice?: string} | undefined;   // testReps 파라미터 제거
```

- [ ] **Step 1: `ProgramTestResult` 작성** — 스펙 4.6
  - 프로그램 조회가 `loading` 이면 로딩 표시, `error` 면 "프로그램 정보를 불러오지 못했어요" + "다시 시도"(`refetch`). 이 두 상태에서는 저장 버튼을 보여주지 않는다.
  - `reps === 0`: "측정된 푸쉬업 횟수가 없어요" + "프로그램으로"(`popTo('Program')`). 아무것도 저장하지 않는다.
  - 그 외: `resolveTest(state, reps)` 의 `outcome` 을 `testOutcomeMessage` 로 보여준다. `start`·`advance`·`repeat`·`finalMiss`·`retest` 는 다음 운동 세트(`describeSets(todayPlan(next).sets, true)`)를 함께 보여준다.
  - "기록하고 프로그램으로": ① `savePushupSession({reps, duration_seconds: duration, mode: 'program_test'})` 는 한 번만 시도하고 실패해도 막지 않는다. ② 프로그램 반영 — `canStartNewProgram(view)` 면 `createProgram({userId, state: next})`, 아니면 `updateProgram({id, state: next})`. ③ 성공하면 `popTo('Program')`.
  - ② 가 진행 중이면 버튼 비활성, 실패하면 "결과를 저장하지 못했어요. 네트워크를 확인해 주세요" + "다시 시도"(② 만 다시).

- [ ] **Step 2: 연결** — `ChallengeScreen` 은 `purpose === 'program-test'` 면 `ProgramTestResult`, 아니면 `ChallengeResult` 를 그린다. `ChallengeResult` 에서 `purpose` prop 과 프로그램 분기를 지운다.

- [ ] **Step 3: `ProgramScreen` 정리** — `testReps` 를 읽어 반영하던 `useEffect` 와 `handledTest` ref 를 지운다. `route.params.notice` 가 있으면 카드 위에 한 줄 안내로 보여주고, 누르면 `setParams({notice: undefined})` 로 지운다.

- [ ] **Step 4: 검증** — `npx tsc --noEmit -p tsconfig.json`, `npx eslint src __tests__` 출력 없음. `grep -rn "testReps" src` 결과 없음.

- [ ] **Step 5: 커밋** — `feat(program): 테스트 결과가 뜻하는 바를 알려주고 저장 실패 시 다시 시도 제공`

---

### Task 6: 운동 흐름 — 통과 규칙, 즉시 안내, 요약

**Files:**
- Create: `src/components/features/program/ProgramDaySummary.tsx`
- Modify: `src/screens/WorkoutScreen.tsx`, `src/components/features/workout/RestTimer.tsx`, `src/domain/hundredPushups.ts`, `__tests__/domain/hundredPushups.test.ts`

**Interfaces:**
- Consumes: `isDayPassed`, `missedSets`, `attemptRecord`, `moveRecord`, `failStreak`, `DOWNGRADE_AFTER`, `downgradeTarget`, `moveTo`, `completeDay`, `nextStepLabel`, `downgradeNotice`, `describeSets`, `todayPlan`, `useUpdateProgramMutation`
- Produces:

```ts
// RestTimer.tsx
interface RestTimerProps {
  remaining: number;
  onSkip: () => void;
  last: {setNumber: number; reps: number; target: number; isMax: boolean};
  next: {setNumber: number; reps: number; isMax: boolean};
  note?: string; // 프로그램 운동에서 처음 못 채운 세트 직후에만
}
// ProgramDaySummary.tsx
interface ProgramDaySummaryProps {
  position: Position;          // 이 운동을 한 위치
  targets: number[]; results: number[]; totalSeconds: number;
  passed: boolean;
  streak: number;              // 이번 시도를 포함한 연속 실패 횟수
  nextLabel: string;           // nextStepLabel 결과
  downgrade: Position | null;  // streak >= DOWNGRADE_AFTER 일 때만 값이 있다
  save: {pending: boolean; error: boolean; onRetry: () => void};
  onDone: () => void;          // "프로그램으로" / "이 레벨로 한 번 더"
  onDowngrade: () => void;
}
```

- [ ] **Step 1: 휴식 화면** — 스펙 4.3. `RestTimer` 가 방금 세트 결과(`세트 2 · 13 / 16  3개 부족` 또는 `… 완료`)와 다음 세트 정보를 보여준다. `WorkoutScreen` 은 휴식 중 `WorkoutHeader` 를 숨기고 `RestTimer` 에 `last`(인덱스 `state.setIndex`)·`next`(인덱스 `state.setIndex + 1`)를 넘긴다. `note` 는 프로그램 운동이고 지금까지의 `state.results` 중 못 채운 세트가 방금 것 하나뿐일 때만 넘긴다.

- [ ] **Step 2: 목표까지 남은 개수** — 스펙 4.2. 카운팅 중 카운트 아래에 "목표까지 N개", 마지막 세트는 최소치를 넘기면 "최소 달성, 가능한 만큼 더". 세트 모드에도 같이 보인다.

- [ ] **Step 3: 통과 판정과 기록** — `WorkoutScreen` 의 프로그램 완료 처리를 교체한다.
  - `phase === 'done'` 이 되면 한 번만: `passed = isDayPassed(plan.sets, results)`, 기록 = `attemptRecord(current, plan.sets, results, now)`, 다음 상태 = `passed ? completeDay(current) : current`. `updateProgram.mutate({id, state, completedDay: 기록, existing: programRow.completed_days})`.
  - 한 운동에 기록은 1건: ref 로 한 번만 보내고, "다시 시도"는 같은 `variables` 를 다시 보낸다 (기록을 새로 만들지 않는다).
  - 프로그램 행이 아직 없으면 올 때까지 기다린다 (요약은 `save.pending` 으로 표시).
  - `suggestRepeat`·`completeProgramDay`·"완료하고 다음으로" 분기를 지운다.

- [ ] **Step 4: 요약 화면** — 스펙 4.4. 프로그램 운동은 `ProgramDaySummary`, 세트 모드는 기존 `WorkoutSummary` 그대로.
  - 통과: 제목 "N주차 Day D 통과", 다음 할 일 "다음은 {nextLabel}".
  - 실패 1번째: 못 채운 세트 번호와 세트별 부족 개수, "모든 세트를 채워야 넘어간다 / 다음 운동도 같은 Day / 한 번 더 못 채우면 레벨을 낮추는 걸 권한다".
  - 실패 2번째 이상이고 `downgrade` 가 있으면: 낮췄을 때의 세트(`describeSets(todayPlan({...current, ...downgrade}).sets, true)`)를 보여주고 주 버튼 "레벨 N으로 낮추기"(이전 주차면 "이전 주차로 돌아가기"), 보조 "이 레벨로 한 번 더".
  - `downgrade` 가 `null`(1주차 레벨 1): 권유 없이 "가장 쉬운 단계예요. 같은 Day를 다시 해요".
  - `save.pending` 동안 버튼 비활성, `save.error` 면 "운동 결과를 저장하지 못했어요" + "다시 시도".
  - `onDowngrade`: 캐시의 최신 행을 읽어 `updateProgram.mutate({id, state: moveTo(current, target), completedDay: moveRecord(이동 후 상태, now), existing: 최신 completed_days})`, 성공 시 `popTo('Program', {notice: downgradeNotice(from, to)})`.

- [ ] **Step 5: 옛 규칙 제거** — `dayAchievementRate`·`shouldSuggestRepeat` 와 그 테스트(`describe('dayAchievementRate / shouldSuggestRepeat')`)를 지운다.

- [ ] **Step 6: 검증** — `npx jest __tests__/domain` PASS, `npx tsc --noEmit -p tsconfig.json`, `npx eslint src __tests__` 출력 없음. `grep -rn "shouldSuggestRepeat\|dayAchievementRate" src __tests__` 결과 없음.

- [ ] **Step 7: 커밋** — `feat(program): 모든 세트를 채워야 통과, 세트 직후·요약에서 이유와 다음 할 일 안내`

---

### Task 7: 프로그램 화면 — 상태별 카드와 홈 카드

**Files:**
- Create: `src/components/features/program/ProgramTodayCard.tsx`, `ProgramTestCard.tsx`, `ProgramCompletedCard.tsx`
- Modify: `src/screens/ProgramScreen.tsx`, `src/screens/HomeScreen.tsx`

**Interfaces:**
- Consumes: `resolveProgramView`, `failStreak`, `lastFailure`, `missedSets`, `DOWNGRADE_AFTER`, `downgradeTarget`, `moveTo`, `moveRecord`, `downgradeNotice`, `testThreshold`, `passedDayCount`, `todayPlan`, `describeSets`
- Produces:

```ts
function ProgramTodayCard(props: {
  state: ProgramState; records: ProgramRecord[];
  onStart: () => void; onRetest: () => void; onOpenTable: () => void;
  onDowngrade: () => void; downgradePending: boolean;
}): React.JSX.Element;
function ProgramTestCard(props: {
  state: ProgramState; records: ProgramRecord[]; onTest: () => void; onOpenTable: () => void;
}): React.JSX.Element;
function ProgramCompletedCard(props: {
  lastTestReps: number; startedAt: string; finishedAt: string; passedDays: number; onRestart: () => void;
}): React.JSX.Element;
```

- [ ] **Step 1: 화면 상태 분기** — `ProgramScreen` 을 `resolveProgramView` 로 나눈다: `loading`(로딩 표시) / `error`("프로그램 정보를 불러오지 못했어요" + "다시 시도") / `none`(기존 소개 카드) / `completed` / `testDue` / `active`. 알림 정리(`cancelWorkoutReminders`)는 `none`·`completed` 일 때만 실행한다 (`loading`·`error` 에서는 하지 않는다). 알림 카드와 "그만두기"는 `active`·`testDue` 에서만.

- [ ] **Step 2: 오늘 카드** — 스펙 4.1. 제목에 레벨 포함, "모든 세트를 채우면 … 넘어가요" 한 줄. `lastFailure` 가 있으면 날짜·못 채운 세트(기록의 `targets` 기준)를 보여준다. `failStreak >= DOWNGRADE_AFTER` 이고 `downgradeTarget` 이 있으면 주 버튼을 하향 권유로 바꾸고 보조 "이 레벨로 한 번 더"가 운동을 시작한다. 하향 처리는 Task 6 의 `onDowngrade` 와 같은 방식(이동 + `moveRecord`)이고, 성공하면 `setParams({notice})`. 링크 문구는 "전체 세트 보기 · 주차 바꾸기".

- [ ] **Step 3: 테스트 카드** — 스펙 4.5. `testThreshold(state.week)` 로 기준 문장을 만든다 (최종은 "100개면 완료"). 마지막 시도 기록의 `completed_at` 이 오늘(기기 날짜)이면 "오늘 Day 3를 했다면 내일 이후에"를 강조한다. "전체 세트 보기 · 주차 바꾸기" 링크를 둔다.

- [ ] **Step 4: 완료 카드** — 스펙 5.1. 최종 테스트 횟수, 시작일~완료일 기간(`created_at`~`updated_at`, 일 단위), `passedDayCount`. "다시 시작"은 확인창("초기 테스트부터 새로 시작해요. 완료 기록은 그대로 남아요") 후 테스트 화면으로. 완료된 행은 건드리지 않는다 (`abandonProgram` 호출 제거).

- [ ] **Step 5: 홈 카드** — `HomeScreen` 의 상태 문구를 `resolveProgramView` 기준으로: `loading`·`error` 는 표시 없음, `none` "시작 전", `testDue` "테스트 차례", `completed` "완료", `active` "N주차 · Day D".

- [ ] **Step 6: 검증** — `npx tsc --noEmit -p tsconfig.json`, `npx eslint src __tests__` 출력 없음.

- [ ] **Step 7: 커밋** — `feat(program): 프로그램 화면에 레벨·통과 조건·실패 이유·하향 권유·완료 화면 표시`

---

### Task 8: 주차 직접 고르기

**Files:**
- Modify: `src/screens/ProgramTableScreen.tsx`

**Interfaces:**
- Consumes: `moveTo`, `moveRecord`, `levelRange`, `jumpNotice`, `resolveProgramView`, `useUpdateProgramMutation`

- [ ] **Step 1: 표에 선택 추가** — 스펙 3.5·4.7. 화면 상태가 `active`·`testDue` 일 때만 주차 카드에 "여기서부터" 버튼을 보여준다. 지금 위치 카드(같은 주차·같은 레벨 탭)에는 버튼 대신 "지금 여기 · Day D"(테스트 차례면 "지금 여기 · 테스트 차례").

- [ ] **Step 2: 확인창과 반영** — 누르면 `Alert`: 제목 "N주차 · 레벨 L · Day 1부터 다시 진행할까요?", 본문 "지금 위치(…)는 사라져요. 운동 기록은 그대로 남아요." `levelRange(week, level).min > lastTestReps` 면 본문에 기준 범위와 최근 테스트 기록을 덧붙인다 (`max` 가 `null` 이면 "N개 이상"). "이 주차로"를 누르면 `updateProgram.mutate({id, state: moveTo(state, {week, day: 1, level}), completedDay: moveRecord(이동 후 상태, now), existing: completed_days})`, 성공 시 `popTo('Program', {notice: jumpNotice(to)})`. 실패하면 `Alert` 로 "주차를 바꾸지 못했어요. 네트워크를 확인해 주세요". 진행 중에는 버튼 비활성.

- [ ] **Step 3: 검증** — `npx tsc --noEmit -p tsconfig.json`, `npx eslint src __tests__` 출력 없음.

- [ ] **Step 4: 커밋** — `feat(program): 전체 프로그램 화면에서 주차·레벨을 직접 골라 다시 진행`

---

### Task 9: 전체 검증

- [ ] **Step 1: 자동 검증** — `npx jest __tests__/domain __tests__/remote __tests__/hooks` 전부 PASS, `npx tsc --noEmit -p tsconfig.json`, `npx eslint src __tests__` 출력 없음.

- [ ] **Step 2: 스펙 대조** — 스펙 3·4·5장을 한 줄씩 읽으며 구현된 화면·함수를 짚는다. 빠진 것이 있으면 해당 Task 로 돌아가 고친다.

- [ ] **Step 3: 기기 확인 목록을 사용자에게 전달** (에이전트는 기기를 돌릴 수 없으므로 아래를 그대로 보고한다)
  1. 운동 요약에서 "프로그램으로" → 프로그램 화면에서 뒤로 → 홈이 나온다
  2. 세트 하나를 일부러 못 채우고 끝까지 → 휴식 화면에 부족 개수와 이유, 요약에 "한 번 더", 프로그램 화면에 지난번 실패 이유, Day 가 그대로
  3. 같은 Day 를 한 번 더 실패 → 하향 권유. "낮추기" 후 세트가 바뀌고 안내가 한 번 뜬다
  4. 요약의 저장 버튼을 연타해도 히스토리·권유가 한 번 실패로 계산된다
  5. 비행기 모드에서 운동 종료 → 저장 실패 안내와 "다시 시도", 네트워크 복구 후 재시도 성공
  6. 운동 중 안드로이드 뒤로가기·iOS 스와이프 → 확인창이 뜬다
  7. 주차 테스트: 카드에 기준 표시, 결과 화면에 해석, 미달 시 같은 주차 반복 이유
  8. "전체 세트 보기 · 주차 바꾸기"에서 다른 주차 선택 → 확인창 → 그 주차 Day 1
  9. (테스트 계정) 최종 테스트 100개 이상 → 완료 화면이 뜨고 앱을 다시 켜도 유지, 홈 카드 "완료"
  10. 세트 모드: 휴식 화면에 결과·다음 세트만 나오고 나머지는 이전과 같다
