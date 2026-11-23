import {resolveProgramView, canStartNewProgram, weekRestartTarget} from '../../src/domain/programView';
import type {ProgramState} from '../../src/domain/hundredPushups';

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

describe('weekRestartTarget', () => {
  const base: ProgramState = {
    week: 5,
    day: 3,
    level: 2,
    lastTestReps: 40,
    testDue: false,
    status: 'active',
  };

  it('주차 중간이면 같은 주차 Day 1 로 되돌린다', () => {
    expect(weekRestartTarget(base)).toEqual({week: 5, day: 1, level: 2});
  });

  it('주차 첫날이면 같은 주차를 다시 하는 게 의미 없으니 앞 주차 Day 1 로', () => {
    expect(weekRestartTarget({...base, day: 1})).toEqual({week: 4, day: 1, level: 2});
  });

  it('1주차 첫날이면 되돌릴 곳이 없다', () => {
    expect(weekRestartTarget({...base, week: 1, day: 1})).toBeNull();
  });

  it('테스트 차례면 같은 주차를 다시 한다', () => {
    expect(weekRestartTarget({...base, day: 1, testDue: true})).toEqual({week: 5, day: 1, level: 2});
  });
});
