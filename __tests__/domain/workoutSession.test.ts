import {createWorkout, workoutReducer, targetFor, shouldConfirmLeave, WorkoutState} from '../../src/domain/workoutSession';

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

  it('beginCountdown → 3·2·1 뒤 tracking', () => {
    const s0 = run([{type: 'beginCountdown'}]);
    expect(s0).toMatchObject({phase: 'countdown', countdownRemaining: 3});
    const s = run([{type: 'countdownTick'}, {type: 'countdownTick'}, {type: 'countdownTick'}], s0);
    expect(s).toMatchObject({phase: 'tracking', currentCount: 0, countdownRemaining: 0});
  });

  it('카운트다운 중 pause 는 준비(idle)로', () => {
    expect(run([{type: 'beginCountdown'}, {type: 'pause'}]).phase).toBe('idle');
  });

  it('카운트다운은 매 틱 1초씩 줄어들고 중단하면 0으로 돌아간다', () => {
    const two = run([{type: 'beginCountdown'}, {type: 'countdownTick'}]);
    expect(two).toMatchObject({phase: 'countdown', countdownRemaining: 2});
    const one = run([{type: 'countdownTick'}], two);
    expect(one).toMatchObject({phase: 'countdown', countdownRemaining: 1});
    expect(run([{type: 'pause'}], one)).toMatchObject({phase: 'idle', countdownRemaining: 0});
  });

  it('tracking 에서 pause → paused, 그동안 count 는 무시, resume → tracking', () => {
    const p = run([{type: 'start'}, {type: 'count', count: 2}, {type: 'pause'}, {type: 'count', count: 3}]);
    expect(p).toMatchObject({phase: 'paused', currentCount: 2});
    expect(run([{type: 'resume'}], p).phase).toBe('tracking');
  });

  it('paused 에서 finishSet 은 지금 개수로 세트를 끝낸다', () => {
    const s = run([{type: 'start'}, {type: 'count', count: 2}, {type: 'pause'}, {type: 'finishSet'}]);
    expect(s).toMatchObject({phase: 'rest', results: [2]});
  });

  it('일시정지 마지막 세트를 끝내면 운동이 완료된다', () => {
    const last: WorkoutState = {...createWorkout(plan), setIndex: 2, phase: 'paused', currentCount: 4, results: [3, 3]};
    expect(run([{type: 'finishSet'}], last)).toMatchObject({phase: 'done', results: [3, 3, 4]});
  });

  it('extendRest 는 휴식 중에만 15초 더한다', () => {
    const r = run([{type: 'start'}, {type: 'count', count: 3}]);
    expect(run([{type: 'extendRest'}], r).restRemaining).toBe(17);
    expect(run([{type: 'extendRest'}])).toEqual(createWorkout(plan));
  });

  it('autoNext 면 휴식이 끝나면 바로 다음 세트를 센다', () => {
    const auto = createWorkout(plan, {autoNext: true});
    const s = run([{type: 'start'}, {type: 'count', count: 3}, {type: 'restTick'}, {type: 'restTick'}], auto);
    expect(s).toMatchObject({phase: 'tracking', setIndex: 1, currentCount: 0});
    const k = run([{type: 'start'}, {type: 'count', count: 3}, {type: 'skipRest'}], auto);
    expect(k).toMatchObject({phase: 'tracking', setIndex: 1});
  });

  it('autoNext 가 꺼져 있으면 지금처럼 준비(idle)로', () => {
    const s = run([{type: 'start'}, {type: 'count', count: 3}, {type: 'skipRest'}]);
    expect(s).toMatchObject({phase: 'idle', setIndex: 1});
  });
});

describe('shouldConfirmLeave (나갈 때 확인이 필요한가)', () => {
  it('카운트다운·일시정지도 나갈 때 확인한다', () => {
    expect(shouldConfirmLeave(run([{type: 'beginCountdown'}]))).toBe(true);
    expect(shouldConfirmLeave(run([{type: 'start'}, {type: 'pause'}]))).toBe(true);
  });

  it('아직 아무것도 시작하지 않았으면 확인 없이 나간다', () => {
    expect(shouldConfirmLeave(createWorkout(plan))).toBe(false);
  });
  it('카운팅 중·휴식 중·다음 세트 대기 중에는 확인한다', () => {
    expect(shouldConfirmLeave(run([{type: 'start'}]))).toBe(true);
    const resting = run([{type: 'start'}, {type: 'count', count: 3}]);
    expect(shouldConfirmLeave(resting)).toBe(true);
    expect(shouldConfirmLeave(run([{type: 'skipRest'}], resting))).toBe(true); // idle 이지만 끝낸 세트가 있다
  });
  it('운동을 끝낸 뒤에는 확인하지 않는다', () => {
    const done = run([
      {type: 'start'}, {type: 'count', count: 3}, {type: 'skipRest'},
      {type: 'start'}, {type: 'count', count: 3}, {type: 'skipRest'},
      {type: 'start'}, {type: 'finishSet'},
    ]);
    expect(done.phase).toBe('done');
    expect(shouldConfirmLeave(done)).toBe(false);
  });
});
