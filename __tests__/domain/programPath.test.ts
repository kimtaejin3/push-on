import type {ProgramState} from '../../src/domain/hundredPushups';
import {programPath} from '../../src/domain/programPath';

const st = (p: Partial<ProgramState>): ProgramState => ({
  week: 1,
  day: 1,
  level: 1,
  lastTestReps: 10,
  testDue: false,
  status: 'active',
  ...p,
});

const attempt = (week: number, day: number) => ({
  week,
  day,
  reps: [1],
  completed_at: '2026-11-01T00:00:00Z',
  passed: true,
});

it('3주차부터 시작: 1·2주차는 건너뜀, 지난 칸에 포함', () => {
  const p = programPath(st({week: 3, day: 2, level: 2}), []);
  expect(p.passed).toBe(15);
  expect(p.total).toBe(42);
  expect(p.weeks[0].cells.every(c => c.status === 'skipped')).toBe(true);
  expect(p.weeks[1].test).toBe('skipped');
  expect(p.weeks[2].cells.slice(0, 3).map(c => c.status)).toEqual([
    'done',
    'today',
    'upcoming',
  ]);
  expect(p.weeks[3].test).toBe('upcoming');
});

it('테스트 차례: 그 주 7칸이 모두 지났고 테스트가 current, today 칸 없음', () => {
  const p = programPath(st({week: 2, day: 7, testDue: true}), [attempt(1, 1)]);
  expect(p.passed).toBe(14);
  expect(p.weeks[1].cells[6].status).toBe('done');
  expect(p.weeks[1].test).toBe('current');
  expect(p.weeks.flatMap(w => w.cells).some(c => c.status === 'today')).toBe(false);
});

it('완료: 42칸 모두 지났고 테스트는 모두 done', () => {
  const p = programPath(st({week: 6, day: 7, status: 'completed'}), [attempt(1, 1)]);
  expect(p.passed).toBe(42);
  expect(p.weeks.flatMap(w => w.cells).every(c => c.status === 'done')).toBe(true);
  expect(p.weeks.filter(w => w.test !== 'none').every(w => w.test === 'done')).toBe(true);
});

it('이동 표시는 시작 주차 계산에 쓰지 않는다', () => {
  const move = {
    kind: 'move' as const,
    week: 1,
    day: 1,
    reps: [],
    completed_at: '2026-11-02T00:00:00Z',
  };
  expect(programPath(st({week: 3, day: 1}), [move]).weeks[0].cells[0].status).toBe('skipped');
});
