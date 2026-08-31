import {
  assignLevel, startProgram, todayPlan, completeDay, applyTest, describeSets, retestLevel, dayAchievementRate, shouldSuggestRepeat, initialTestPreview,
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
    expect(rows[0]).toMatchObject({week: 1, sets: '2 · 3 · 2 · 2 · 3+', restSeconds: 60});
    expect(rows[1]).toMatchObject({week: 1, sets: '6 · 6 · 4 · 4 · 5+'});
    expect(rows[2]).toMatchObject({week: 1, sets: '10 · 12 · 7 · 7 · 9+'});
    // 20개 초과는 1·2주차를 건너뛰고 3주차부터
    expect(rows[3]).toMatchObject({week: 3, sets: '14 · 18 · 14 · 14 · 20+'});
  });
});
