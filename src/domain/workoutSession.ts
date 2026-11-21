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

/**
 * 화면을 나갈 때 확인이 필요한가: 운동을 시작했고 아직 끝내지 않았을 때만.
 * (들어오자마자 아무것도 안 하고 나가는 경우에는 묻지 않는다)
 */
export const shouldConfirmLeave = (state: WorkoutState): boolean =>
  state.phase !== 'done' && (state.phase !== 'idle' || state.results.length > 0);

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
      // 값이 같으면 같은 객체를 돌려줘 불필요한 리렌더/루프를 막는다
      if (state.phase !== 'tracking' || event.count === state.currentCount) {
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
