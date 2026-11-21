import {useCallback, useMemo, useReducer} from 'react';
import useInterval from './useInterval';
import {createWorkout, targetFor, workoutReducer, WorkoutPlan} from '../domain/workoutSession';

/**
 * 세트 운동 상태기계(domain/workoutSession)를 리액트에 연결한다.
 * 카운트다운과 휴식은 각 단계에 진입한 뒤 1초마다 진행한다.
 */
export const useWorkoutSession = (plan: WorkoutPlan, options?: {autoNext?: boolean}) => {
  const [state, dispatch] = useReducer(workoutReducer, plan, initialPlan => createWorkout(initialPlan, options));

  useInterval(() => dispatch({type: 'countdownTick'}), state.phase === 'countdown' ? 1000 : null);
  useInterval(() => dispatch({type: 'restTick'}), state.phase === 'rest' ? 1000 : null);

  const start = useCallback(() => dispatch({type: 'start'}), []);
  const beginCountdown = useCallback(() => dispatch({type: 'beginCountdown'}), []);
  const pause = useCallback(() => dispatch({type: 'pause'}), []);
  const resume = useCallback(() => dispatch({type: 'resume'}), []);
  const count = useCallback((n: number) => dispatch({type: 'count', count: n}), []);
  const finishSet = useCallback(() => dispatch({type: 'finishSet'}), []);
  const skipRest = useCallback(() => dispatch({type: 'skipRest'}), []);
  const extendRest = useCallback(() => dispatch({type: 'extendRest'}), []);
  const target = useMemo(() => targetFor(state), [state]);

  return {state, target, start, beginCountdown, pause, resume, count, finishSet, skipRest, extendRest};
};
