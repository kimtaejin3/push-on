import {
  assignLevel, startProgram, todayPlan, completeDay, applyTest, describeSets, retestLevel, dayAchievementRate, shouldSuggestRepeat, initialTestPreview, programTable,
  isDayPassed, missedSets, attemptRecord, moveRecord, failStreak, lastFailure, passedDayCount,
  downgradeTarget, moveTo, levelRange, testThreshold,
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

describe('retestLevel (레벨 다시 재기)', () => {
  const active = {week: 1, day: 2, level: 1 as const, lastTestReps: 3, testDue: false, status: 'active' as const};

  it('현재 주차 기준으로 열만 다시 배정하고 주차/일차는 유지한다', () => {
    expect(retestLevel(active, 12)).toEqual({...active, level: 3, lastTestReps: 12});
  });

  it('3주차 이상에서 최소 미달이면 열 1 로 둔다', () => {
    const w3 = {...active, week: 3, level: 2 as const};
    expect(retestLevel(w3, 10)).toMatchObject({week: 3, day: 2, level: 1, lastTestReps: 10});
  });

  it('테스트 차례(testDue)이거나 완료 상태면 그대로 돌려준다', () => {
    const due = {...active, testDue: true};
    expect(retestLevel(due, 30)).toBe(due);
    const done = {...active, status: 'completed' as const};
    expect(retestLevel(done, 30)).toBe(done);
  });
});

describe('dayAchievementRate / shouldSuggestRepeat', () => {
  const plan = [6, 6, 4, 4, 5]; // 목표 합 25 (마지막은 최소치)

  it('실제 합 ÷ 목표 합을 돌려준다', () => {
    expect(dayAchievementRate(plan, [6, 6, 4, 4, 5])).toBe(1);
    expect(dayAchievementRate(plan, [3, 3, 2, 2, 2.5])).toBeCloseTo(0.5);
    expect(dayAchievementRate(plan, [6, 6, 4, 4, 15])).toBeGreaterThan(1);
  });

  it('80% 미만이면 다시 하기를 제안한다 (경계 포함 안 함)', () => {
    expect(shouldSuggestRepeat(plan, [6, 6, 4, 4, 5])).toBe(false);
    expect(shouldSuggestRepeat(plan, [6, 6, 4, 4, 0])).toBe(false); // 20/25 = 0.8
    expect(shouldSuggestRepeat(plan, [6, 6, 4, 3, 0])).toBe(true); // 19/25
    expect(shouldSuggestRepeat(plan, [1, 1, 1, 1, 1])).toBe(true);
  });

  it('목표 합이 0 이면 제안하지 않는다', () => {
    expect(shouldSuggestRepeat([], [])).toBe(false);
  });
});

describe('initialTestPreview', () => {
  it('테스트 구간 4개를 실제 프로그램 표에서 계산해 돌려준다', () => {
    const rows = initialTestPreview();
    expect(rows.map(r => r.range)).toEqual(['5개 이하', '6 ~ 10개', '11 ~ 20개', '21개 이상']);
    // 같은 1주차라도 테스트 결과에 따라 레벨이 갈려 횟수가 달라진다
    expect(rows[0]).toMatchObject({week: 1, level: 1, sets: '2 · 3 · 2 · 2 · 3+', restSeconds: 60});
    expect(rows[1]).toMatchObject({week: 1, level: 2, sets: '6 · 6 · 4 · 4 · 5+'});
    expect(rows[2]).toMatchObject({week: 1, level: 3, sets: '10 · 12 · 7 · 7 · 9+'});
    // 20개 초과는 1·2주차를 건너뛰고 3주차부터
    expect(rows[3]).toMatchObject({week: 3, level: 3, sets: '14 · 18 · 14 · 14 · 20+'});
  });
});

describe('programTable', () => {
  it('레벨별로 6주 × 3일 세트를 돌려준다', () => {
    const table = programTable(2);
    expect(table).toHaveLength(6);
    expect(table[0]).toMatchObject({week: 1, hasTest: false});
    expect(table[0].days).toEqual([
      {day: 1, sets: '6 · 6 · 4 · 4 · 5+', restSeconds: 60},
      {day: 2, sets: '6 · 8 · 6 · 6 · 7+', restSeconds: 60},
      {day: 3, sets: '8 · 10 · 7 · 7 · 10+', restSeconds: 60},
    ]);
  });

  it('테스트가 있는 주차(2·4·5·6)를 표시한다', () => {
    const table = programTable(1);
    expect(table.filter(w => w.hasTest).map(w => w.week)).toEqual([2, 4, 5, 6]);
  });

  it('주차·요일마다 휴식 시간이 다르다', () => {
    const table = programTable(1);
    expect(table[1].days.map(d => d.restSeconds)).toEqual([60, 90, 120]);
    expect(table[4].days.map(d => d.restSeconds)).toEqual([60, 45, 45]);
  });

  it('레벨 3 의 6주차 마지막 날은 9세트다', () => {
    const table = programTable(3);
    expect(table[5].days[2].sets).toBe('26 · 26 · 33 · 33 · 26 · 26 · 22 · 22 · 60+');
  });
});

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
