import {testOutcomeMessage, nextStepLabel, downgradeNotice, jumpNotice, withJosa} from '../../src/domain/programMessages';

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
    expect(body(3, {kind: 'retest', week: 1, level: 1, prevLevel: 1})).toBe('레벨은 그대로 1이에요');
    expect(body(30, {kind: 'retest', week: 3, level: 3, prevLevel: 3})).toBe('레벨은 그대로 3이에요');
  });
});

describe('nextStepLabel', () => {
  const s = (week: number, day: number) => ({week, day, level: 1 as const, lastTestReps: 0, testDue: false, status: 'active' as const});
  it('통과한 뒤 할 일을 말한다', () => {
    expect(nextStepLabel(s(2, 2))).toBe('2주차 Day 3');
    expect(nextStepLabel(s(1, 3))).toBe('1주차 Day 4');
    expect(nextStepLabel(s(1, 7))).toBe('2주차 Day 1');
    expect(nextStepLabel(s(2, 7))).toBe('2주차 테스트');
    expect(nextStepLabel(s(6, 7))).toBe('최종 테스트');
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

describe('withJosa (숫자 뒤 조사)', () => {
  it('을/를: 받침 있는 숫자(1·3·6·7·8·0)는 을', () => {
    expect([1, 2, 3].map(n => withJosa(n, '을'))).toEqual(['1을', '2를', '3을']);
    expect([4, 5, 6, 7, 8, 9, 10].map(n => withJosa(n, '을'))).toEqual(['4를', '5를', '6을', '7을', '8을', '9를', '10을']);
  });
  it('은/는', () => {
    expect([1, 2, 3].map(n => withJosa(n, '은'))).toEqual(['1은', '2는', '3은']);
  });
  it('이에요/예요', () => {
    expect([1, 2, 3].map(n => withJosa(n, '이에요'))).toEqual(['1이에요', '2예요', '3이에요']);
  });
  it('(으)로: ㄹ 받침(1·7·8)은 로', () => {
    expect([1, 2, 3, 6, 7, 8].map(n => withJosa(n, '으로'))).toEqual(['1로', '2로', '3으로', '6으로', '7로', '8로']);
  });
});
