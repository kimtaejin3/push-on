# 100개 챌린지 매일 운동(주 7일) 전환 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 100개 챌린지를 주 3일에서 주 7일(매일) 루틴으로 바꾸고, 전체 프로그램 화면에서 각 Day 의 총 개수와 주차·레벨의 기준 범위를 보여준다.

**Architecture:** 원본 3일 표(`PROGRAM`)는 그대로 두고, 7일 표는 순수 함수로 계산한다(`src/domain/dailyProgram.ts`). 세트를 돌려주는 기존 진입점(`todayPlan`, `describeSetsAt`, `programTable`)이 7일 표를 쓰도록 바꾸면 화면은 대부분 그대로 따라온다. "오늘 완료" 판단과 테스트 표시는 기존 `completed_days` 기록에서 계산한다.

**Tech Stack:** React Native 0.79, TanStack Query v5, Supabase, Jest.

**Spec:** `docs/superpowers/specs/2026-11-21-daily-program-design.md` — 화면 문구·스케치는 스펙 5장을 따른다. 앞선 작업의 스펙은 `docs/superpowers/specs/2026-11-21-hundred-challenge-ux-design.md`.

## Global Constraints

- DB 스키마를 바꾸지 않는다. 원본 표 `PROGRAM` 의 숫자를 바꾸지 않는다.
- 분량 비율은 상수 하나: `DAILY_VOLUME_RATIO = 0.6`. 한 주는 `DAYS_PER_WEEK = 7`.
- 통과 판정·하향 권유·주차 직접 고르기·테스트 기준(16·31·46·100)·레벨 구간은 바꾸지 않는다.
- 진행 중인 사용자의 주차·Day·레벨 숫자는 변환하지 않고 그대로 이어간다.
- 세트 모드·챌린지 모드는 건드리지 않는다.
- 안내 문구는 "사실 + 이유 + 다음에 할 일", 꾸중 금지. 숫자 뒤 조사는 `withJosa`(`src/domain/programMessages.ts`)를 쓴다.
- 화면 테스트 인프라가 없다. 화면 작업은 타입체크·린트로 검증한다.
- 검증 명령(모두 출력·실패 없이 끝나야 함): `npx jest __tests__/domain __tests__/remote __tests__/hooks __tests__/utils`, `npx tsc --noEmit -p tsconfig.json`, `npx eslint src __tests__`. `__tests__/App.test.tsx` 는 원래 깨져 있으므로 전체 `npx jest` 로 판단하지 않는다.
- main 에 직접 커밋한다. 메시지는 한국어. push 하지 않는다.

## Review Focus

- **옛 표에서 남긴 실패 기록**: 업데이트 직후 옛 목표(`targets`)로 남은 실패가 연속 실패로 세어져 하향 권유가 뜨면 안 된다 → Task 2.
- **Day 가 4~7 인 상태에서 옛 Day 3 전제 코드**: `PROGRAM[week][day]` 를 직접 읽는 곳이 남으면 화면이 죽는다. 세트는 반드시 `dailyDay` 를 거쳐야 한다 → Task 1 (grep 검증).
- **자정을 넘긴 "오늘"**: 어제 통과한 기록이 오늘 완료로 보이면 안 된다 → Task 2.
- **"미리 하기"로 다음 Day 를 하다 실패**: 오늘 통과 기록이 있어도 "오늘 완료"가 아니라 다시 하기 카드가 보여야 한다 → Task 2.
- **이미 저장된 알림 요일(월·수·금)**: 3일 제한을 풀면서 저장된 값이 바뀌거나 사라지면 안 된다 → Task 5.

---

## File Structure

| 파일 | 책임 |
|---|---|
| `src/constants/hundredPushups.ts` (수정) | `DAYS_PER_WEEK = 7`, `DAILY_VOLUME_RATIO` |
| `src/domain/dailyProgram.ts` (신규) | 원본 3일 표 → 7일 표 계산 |
| `src/domain/hundredPushups.ts` (수정) | 세트 조회를 7일 표로, 테스트 표시, 옛 표 실패 제외, 오늘 완료 판단 |
| `src/components/features/program/*.tsx`, `src/screens/Program*.tsx` (수정) | 오늘 완료 카드, 문구, 전체 프로그램 표 |
| `src/utils/reminder.ts`, `ReminderSettingsCard.tsx` (수정) | 알림 요일 7일 |

---

### Task 1: 7일 표 계산과 세트 조회 전환

**Files:**
- Create: `src/domain/dailyProgram.ts`, `__tests__/domain/dailyProgram.test.ts`
- Modify: `src/constants/hundredPushups.ts`, `src/domain/hundredPushups.ts`, `__tests__/domain/hundredPushups.test.ts`, `__tests__/domain/programMessages.test.ts`

**Interfaces:**
- Produces:

```ts
// constants/hundredPushups.ts
export const DAYS_PER_WEEK = 7;          // 3 에서 변경
export const DAILY_VOLUME_RATIO = 0.6;
// domain/dailyProgram.ts
export type DailyDay = {rest: number; sets: number[]};
export const buildDailyWeek: (week: ProgramDay[], level: 1 | 2 | 3, ratio?: number) => DailyDay[]; // 길이 7
export const dailyDay: (week: number, day: number, level: 1 | 2 | 3) => DailyDay; // week 1..6, day 1..7
// domain/hundredPushups.ts — 서명은 그대로, 7일 표를 쓴다
todayPlan, describeSetsAt, planMatches, initialTestPreview
export type ProgramTableDay = {day: number; sets: string; restSeconds: number; total: number}; // total 추가
```

- [ ] **Step 1: 실패하는 테스트 작성** — `__tests__/domain/dailyProgram.test.ts`

```ts
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
```

`__tests__/domain/hundredPushups.test.ts` 에서 3일 표를 전제한 기대값을 아래로 바꾼다 (테스트 이름도 맞게):

```ts
// todayPlan
expect(todayPlan({week: 2, day: 3, level: 1, lastTestReps: 4, testDue: false, status: 'active'}))
  .toEqual({sets: [3, 4, 2, 2, 4], restSeconds: 90, lastIsMax: true});
// completeDay
expect(completeDay({...base, week: 1, day: 3})).toMatchObject({week: 1, day: 4, testDue: false});
expect(completeDay({...base, week: 1, day: 7})).toMatchObject({week: 2, day: 1, testDue: false});
expect(completeDay({...base, week: 3, day: 7})).toMatchObject({week: 4, day: 1, testDue: false});
[2, 4, 5, 6].forEach(week =>
  expect(completeDay({...base, week, day: 7})).toMatchObject({week, day: 7, testDue: true}));
// initialTestPreview (range·week·level 은 그대로)
'1 · 2 · 1 · 1 · 2+' / '4 · 4 · 2 · 2 · 3+' / '6 · 7 · 4 · 4 · 5+' / '8 · 11 · 8 · 8 · 12+'
// programTable
expect(programTable(2)[0].days).toHaveLength(7);
expect(programTable(2)[0].days[0]).toEqual({day: 1, sets: '4 · 4 · 2 · 2 · 3+', restSeconds: 60, total: 15});
expect(programTable(2)[0].days.map(d => d.total)).toEqual([15, 17, 18, 21, 22, 23, 25]);
expect(programTable(1)[1].days.map(d => d.restSeconds)).toEqual([60, 60, 90, 90, 90, 120, 120]);
expect(programTable(1)[4].days.map(d => d.restSeconds)).toEqual([60, 60, 45, 45, 45, 45, 45]);
expect(programTable(3)[5].days[6].sets).toBe('16 · 16 · 20 · 20 · 16 · 16 · 13 · 13 · 36+');
// describeSetsAt
expect(describeSetsAt({week: 2, day: 2, level: 2})).toBe('6 · 7 · 5 · 5 · 7+');
expect(describeSetsAt({week: 2, day: 2, level: 3})).toBe('8 · 9 · 6 · 6 · 9+');
// planMatches: 2주차 Day 2 레벨 3 의 세트는 [8, 9, 6, 6, 9]
```

`__tests__/domain/programMessages.test.ts` 의 `nextStepLabel`:

```ts
expect(nextStepLabel(s(2, 2))).toBe('2주차 Day 3');
expect(nextStepLabel(s(1, 3))).toBe('1주차 Day 4');
expect(nextStepLabel(s(1, 7))).toBe('2주차 Day 1');
expect(nextStepLabel(s(2, 7))).toBe('2주차 테스트');
expect(nextStepLabel(s(6, 7))).toBe('최종 테스트');
```

- [ ] **Step 2: 실패 확인** — `npx jest __tests__/domain` → 새 파일은 모듈 없음으로, 바꾼 기대값은 옛 값으로 FAIL

- [ ] **Step 3: 구현**
  - `constants`: `DAYS_PER_WEEK = 7`, `DAILY_VOLUME_RATIO = 0.6` 추가.
  - `buildDailyWeek` 는 계산 순서까지 아래와 같아야 테스트의 숫자가 나온다:

```ts
const sum = (a: number[]) => a.reduce((x, y) => x + y, 0);
export const buildDailyWeek = (week: ProgramDay[], level: 1 | 2 | 3, ratio = DAILY_VOLUME_RATIO): DailyDay[] => {
  const anchors = week.map(d => ({rest: d.rest, sets: d.sets[level - 1]})); // 원본 Day 1·2·3
  return Array.from({length: DAYS_PER_WEEK}, (_, index) => {
    const t = index / 3;                       // Day 1→0, Day 4→1, Day 7→2
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
```

  - `dailyDay` 는 6주 × 3레벨 표를 모듈에서 한 번 계산해 두고 조회한다.
  - `hundredPushups.ts`: `todayPlan`, `describeSetsAt`, `programTable` 이 `dailyDay` 를 쓴다. `programTable` 의 각 Day 에 `total`(세트 합)을 넣는다. `PROGRAM[...]` 을 직접 읽어 세트를 꺼내는 코드는 `dailyProgram.ts` 밖에 남기지 않는다.

- [ ] **Step 4: 통과 확인** — `npx jest __tests__/domain` PASS, `npx tsc --noEmit -p tsconfig.json` 출력 없음. `grep -rn "PROGRAM\[" src` 결과가 `src/domain/dailyProgram.ts` 뿐.

- [ ] **Step 5: 커밋** — `feat(program): 원본 3일 표에서 주 7일 표를 계산해 매일 운동으로 전환`

---

### Task 2: 기록 규칙 — 옛 표 실패 제외, 테스트 표시, 오늘 완료 판단

**Files:**
- Modify: `src/domain/hundredPushups.ts`, `__tests__/domain/hundredPushups.test.ts`, `src/components/features/program/ProgramTestResult.tsx`

**Interfaces:**
- Consumes: Task 1 의 `todayPlan`(7일 표)
- Produces:

```ts
export type ProgramRecord = {...; kind?: 'move' | 'test'};      // 'test' 추가
export const testRecord: (state: ProgramState, at: string) => ProgramRecord; // 테스트 반영 "후" 상태를 받는다
export type TodayProgress = 'open' | 'doneWorkout' | 'doneTest';
export const todayProgress: (records: ProgramRecord[], state: ProgramState, createdAt: string, now: Date) => TodayProgress;
// failStreak, lastFailure: 기록의 targets 가 지금 그 위치의 세트와 같을 때만 실패로 센다
// passedDayCount: kind 가 있는 기록(move, test)은 세지 않는다
```

- [ ] **Step 1: 실패하는 테스트 작성** — `__tests__/domain/hundredPushups.test.ts`

기존 `fail`/`pass` 헬퍼의 목표를 실제 표의 값으로 바꾼다 (2주차 Day 2 레벨 3 = `[8, 9, 6, 6, 9]`). 위치가 다른 헬퍼 호출은 그 위치의 `todayPlan(s).sets` 를 쓰도록 한다:

```ts
const fail = (s: ReturnType<typeof pos>) => {
  const targets = todayPlan(s).sets;
  return attemptRecord(s, targets, targets.map((n, i) => (i === 1 ? n - 1 : n)), at); // 세트 2 만 1개 부족
};
const pass = (s: ReturnType<typeof pos>) => attemptRecord(s, todayPlan(s).sets, todayPlan(s).sets, at);
```

이 헬퍼의 결과를 글자 그대로 비교하던 기존 기대값(시도 기록의 모양을 확인하는 테스트)은 새 목표 `[8, 9, 6, 6, 9]`·결과 `[8, 8, 6, 6, 9]` 에 맞춘다.

추가:

```ts
describe('옛 표에서 남긴 실패는 세지 않는다', () => {
  const s = pos(2, 2, 3);
  const oldFail = attemptRecord(s, [14, 16, 12, 12, 17], [14, 13, 12, 10, 17], at); // 3일 표 시절의 목표
  it('목표가 지금 세트와 다르면 연속 실패·지난 실패에서 뺀다', () => {
    expect(failStreak([oldFail, oldFail], s)).toBe(0);
    expect(lastFailure([oldFail], s)).toBeNull();
  });
  it('옛 실패 뒤에 지금 표로 실패하면 그것만 센다', () => {
    expect(failStreak([oldFail, fail(s)], s)).toBe(1);
  });
});

describe('testRecord / passedDayCount', () => {
  it('테스트 표시는 kind: test 이고 시도가 아니다', () => {
    const s = pos(3, 1, 2);
    expect(testRecord(s, at)).toEqual({kind: 'test', week: 3, day: 1, level: 2, reps: [], completed_at: at});
    expect(passedDayCount([pass(s), testRecord(s, at), moveRecord(s, at)])).toBe(1);
  });
  it('테스트 표시에서 연속 실패가 끊긴다', () => {
    const s = pos(2, 2, 3);
    expect(failStreak([fail(s), fail(s), testRecord(s, at)], s)).toBe(0);
  });
});

describe('todayProgress (오늘 할 일을 했는가)', () => {
  const s = pos(3, 2, 2);
  const now = new Date(2026, 10, 21, 15, 0);                       // 기기 날짜 11월 21일
  const today = new Date(2026, 10, 21, 9, 0).toISOString();
  const yesterday = new Date(2026, 10, 20, 23, 50).toISOString();
  const longAgo = new Date(2026, 10, 1, 9, 0).toISOString();
  const passAt = (state: ReturnType<typeof pos>, when: string) =>
    attemptRecord(state, todayPlan(state).sets, todayPlan(state).sets, when);
  const failAt = (state: ReturnType<typeof pos>, when: string) =>
    attemptRecord(state, todayPlan(state).sets, todayPlan(state).sets.map(() => 0), when);

  it('오늘 기록이 없으면 open', () => {
    expect(todayProgress([], s, longAgo, now)).toBe('open');
    expect(todayProgress([passAt(pos(3, 1, 2), yesterday)], s, longAgo, now)).toBe('open'); // 어제 통과는 오늘이 아니다
  });
  it('오늘 통과했으면 doneWorkout', () => {
    expect(todayProgress([passAt(pos(3, 1, 2), today)], s, longAgo, now)).toBe('doneWorkout');
  });
  it('오늘 테스트를 했으면 doneTest', () => {
    expect(todayProgress([testRecord(s, today)], s, longAgo, now)).toBe('doneTest');
  });
  it('초기 테스트로 오늘 프로그램을 만들었으면 doneTest', () => {
    expect(todayProgress([], pos(1, 1, 2), today, now)).toBe('doneTest');
  });
  it('마지막 기록이 지금 위치의 실패면 오늘 통과가 있어도 open (미리 하다 실패)', () => {
    expect(todayProgress([passAt(pos(3, 1, 2), today), failAt(s, today)], s, longAgo, now)).toBe('open');
  });
  it('이동 표시만으로는 완료가 아니고, 오늘 통과 뒤의 이동은 완료를 지우지 않는다', () => {
    expect(todayProgress([moveRecord(s, today)], s, longAgo, now)).toBe('open');
    expect(todayProgress([passAt(pos(3, 1, 2), today), moveRecord(s, today)], s, longAgo, now)).toBe('doneWorkout');
  });
});
```

- [ ] **Step 2: 실패 확인** — `npx jest __tests__/domain/hundredPushups.test.ts` → FAIL

- [ ] **Step 3: 구현**
  - "오늘"은 기기 날짜: `completed_at`·`createdAt` 을 `Date` 로 바꿔 `now` 와 연·월·일을 비교한다.
  - `todayProgress` 순서: ① `lastFailure` 가 있으면 `'open'` ② 오늘 날짜의 기록 중 가장 뒤의 "통과한 시도 또는 테스트 표시"가 시도면 `'doneWorkout'`, 테스트면 `'doneTest'` ③ 없고 `createdAt` 이 오늘이면 `'doneTest'` ④ 아니면 `'open'`.
  - `ProgramTestResult.tsx`: 기존 프로그램을 갱신하는 경우(주차 테스트·레벨 다시 재기) `updateProgram` 에 `completedDay: testRecord(result.next, new Date().toISOString())`, `existing: result.row.completed_days` 를 함께 넘긴다. 최종 테스트로 완료된 경우에도 같다. 새로 만드는 경우는 넘기지 않는다.

- [ ] **Step 4: 통과 확인** — `npx jest __tests__/domain` PASS, `npx tsc --noEmit -p tsconfig.json`, `npx eslint src __tests__` 출력 없음

- [ ] **Step 5: 커밋** — `feat(program): 옛 표 실패 제외, 테스트 표시 기록, 오늘 완료 판단 추가`

---

### Task 3: 오늘 완료 카드와 매일 기준 문구

**Files:**
- Create: `src/components/features/program/ProgramDoneTodayCard.tsx`
- Modify: `src/screens/ProgramScreen.tsx`, `src/components/features/program/ProgramTodayCard.tsx`, `ProgramDaySummary.tsx`, `ProgramTestCard.tsx`

**Interfaces:**
- Consumes: `todayProgress`, `todayPlan`, `describeSets`, `withJosa`
- Produces:

```ts
function ProgramDoneTodayCard(props: {
  kind: 'doneWorkout' | 'doneTest';
  next: ProgramState;            // 내일 할 위치 (현재 상태)
  onStartEarly: () => void;      // "미리 하기"
  onOpenTable: () => void;
}): React.JSX.Element;
```

- [ ] **Step 1: 오늘 완료 카드** — 스펙 5.2. `ProgramScreen` 에서 화면 상태가 `active` 이고 `todayProgress(records, state, programRow.created_at, new Date())` 가 `'open'` 이 아니면 `ProgramTodayCard` 대신 `ProgramDoneTodayCard` 를 그린다. 제목은 `doneWorkout` 이면 "오늘 운동 완료", `doneTest` 면 "오늘은 테스트를 했어요". 본문 "내일 이어서 해요", 그 아래 "내일  N주차 · Day D · 레벨 L" 과 세트. 주 버튼은 두지 않고 링크 "미리 하기"(운동 시작)와 "전체 세트 보기 · 주차 바꾸기"만 둔다. 화면 상태가 `testDue` 일 때는 기존 `ProgramTestCard` 를 그대로 쓴다.

- [ ] **Step 2: 문구** — 스펙 5.3.
  - `ProgramTodayCard`: "하루 쉬고 다음 운동을 권장해요" 줄 삭제.
  - `ProgramScreen` 소개 카드: "주 3일, 하루 5세트." → "매일, 하루 5세트 안팎.", "Day 2 · Day 3 로 갈수록 횟수가 조금씩 늘어나요." → "Day 가 지날수록 횟수가 조금씩 늘어나요.", "6주 프로그램이지만" 문장은 유지.
  - `ProgramDaySummary` 통과 문구: "… · 하루 쉬고 하는 걸 권해요." → "… · 내일 이어서 해요."
  - `ProgramTestCard`: 오늘 이미 운동한 경우의 안내는 그대로, 아닌 경우 "충분히 쉰 날에 재는 걸 권해요." → "오늘은 운동 대신 테스트하는 날이에요."

- [ ] **Step 3: 검증** — `npx tsc --noEmit -p tsconfig.json`, `npx eslint src __tests__` 출력 없음. `grep -rn "하루 쉬고\|주 3일" src` 결과가 `src/utils/reminder.ts`·`ReminderSettingsCard.tsx`(Task 5 에서 처리) 외에는 없음.

- [ ] **Step 4: 커밋** — `feat(program): 오늘 운동을 마치면 완료 카드로 바꾸고 문구를 매일 기준으로 수정`

---

### Task 4: 전체 프로그램 화면 — 기준 범위 · 내 기록 · Day 별 총 개수

**Files:**
- Modify: `src/screens/ProgramTableScreen.tsx`

**Interfaces:**
- Consumes: `programTable`(각 Day 의 `total`), `levelRange`

- [ ] **Step 1: 표시 추가** — 스펙 5.1.
  - 주차 카드 제목 옆에 그 레벨의 기준: `levelRange(week, level)` → "최대 16~20개 기준" (`max` 가 `null` 이면 "최대 26개 이상 기준", `min` 이 0 이면 "최대 5개 이하 기준").
  - 진행 중인 프로그램이 있고 `lastTestReps` 가 그 범위 안이면 "내 기록 N개"를 덧붙인다.
  - 각 Day 줄에 "합 N" 을 세트 문자열과 휴식 사이에 보여준다.
  - 맨 위 설명에 "매일 한 Day 씩, 한 주는 7일이에요"를 넣는다.
  - 좁은 화면에서 줄이 넘치지 않게 세트 문자열은 줄바꿈을 허용한다 (5·6주차는 8~9세트).

- [ ] **Step 2: 검증** — `npx tsc --noEmit -p tsconfig.json`, `npx eslint src __tests__` 출력 없음

- [ ] **Step 3: 커밋** — `feat(program): 전체 프로그램 화면에 레벨 기준 범위·내 기록·Day 별 총 개수 표시`

---

### Task 5: 운동 알림을 매일로

**Files:**
- Modify: `src/utils/reminder.ts`, `__tests__/utils/reminder.test.ts`, `src/components/features/program/ReminderSettingsCard.tsx`

**Interfaces:**
- Produces: `MAX_REMINDER_DAYS = 7`, `DEFAULT_REMINDER_SETTINGS.days = [0, 1, 2, 3, 4, 5, 6]`

- [ ] **Step 1: 실패하는 테스트 작성** — `__tests__/utils/reminder.test.ts` 의 해당 테스트를 교체

```ts
it('기본값: 꺼짐, 매일 20:00', () => {
  expect(DEFAULT_REMINDER_SETTINGS).toEqual({enabled: false, days: [0, 1, 2, 3, 4, 5, 6], hour: 20, minute: 0});
});
it('요일은 7일 모두 고를 수 있다 (매일 하는 프로그램)', () => {
  expect(clampReminderSettings({enabled: true, days: [6, 0, 1, 2, 3, 4, 5], hour: 20, minute: 0}).days)
    .toEqual([0, 1, 2, 3, 4, 5, 6]);
  expect(MAX_REMINDER_DAYS).toBe(7);
});
it('이미 저장된 월·수·금 설정은 그대로 읽힌다', async () => {
  mockGetItem.mockResolvedValue(JSON.stringify({enabled: true, days: [1, 3, 5], hour: 20, minute: 0}));
  await expect(loadReminderSettings()).resolves.toEqual({enabled: true, days: [1, 3, 5], hour: 20, minute: 0});
});
```

(`mockGetItem` 은 그 파일이 이미 쓰는 AsyncStorage 목 이름에 맞춘다.)

- [ ] **Step 2: 실패 확인** — `npx jest __tests__/utils/reminder.test.ts` → FAIL

- [ ] **Step 3: 구현** — 상수와 주석을 바꾼다. `ReminderSettingsCard`: "최대 3일" 비활성 처리와 안내 문구를 없애고, 켜져 있는데 고른 요일이 7일 미만이면 "매일 하는 프로그램이에요. 요일을 모두 켜 두는 걸 권해요"를 보여준다. 최소 하루는 남기는 기존 동작은 유지한다.

- [ ] **Step 4: 통과 확인** — `npx jest __tests__/utils __tests__/hooks` PASS, `npx tsc --noEmit -p tsconfig.json`, `npx eslint src __tests__` 출력 없음

- [ ] **Step 5: 커밋** — `feat(reminder): 운동 알림 요일을 7일 모두 고를 수 있게 하고 기본값을 매일로`

---

### Task 6: 전체 검증

- [ ] **Step 1: 자동 검증** — Global Constraints 의 세 명령 모두 통과.
- [ ] **Step 2: 스펙 대조** — 스펙 3·4·5장을 한 줄씩 읽으며 구현을 짚는다. 빠진 것은 해당 Task 로 돌아가 고친다.
- [ ] **Step 3: 기기 확인 목록 전달**
  1. 프로그램 화면의 오늘 세트가 7일 표의 값이고, 통과하면 다음 Day(4 이상 포함)로 넘어간다
  2. 오늘 통과 후 프로그램 화면이 "오늘 운동 완료"로 바뀌고 "미리 하기"로 다음 Day 를 할 수 있다
  3. "미리 하기"로 하다 실패하면 다시 하기 카드가 보인다
  4. 전체 프로그램 화면에 Day 1~7, 합계, 기준 범위, 내 기록이 보인다
  5. 주차 끝(Day 7) 통과 후 테스트 차례가 되고, 테스트한 날은 "오늘은 테스트를 했어요"로 보인다
  6. 운동 알림에서 7일 모두 고를 수 있고, 기존에 골라 둔 요일이 그대로 남아 있다
