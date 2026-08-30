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

  it('같은 count 가 다시 오면 같은 상태 객체를 돌려준다 (렌더 루프 방지)', () => {
    const s = run([{type: 'start'}, {type: 'count', count: 2}]);
    expect(workoutReducer(s, {type: 'count', count: 2})).toBe(s);
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
