import {useCallback, useMemo, useReducer} from 'react';
import useInterval from './useInterval';
import {createWorkout, targetFor, workoutReducer, WorkoutPlan} from '../domain/workoutSession';

/**
 * 세트 운동 상태기계(domain/workoutSession)를 리액트에 연결한다.
 * 휴식 단계에서만 1초 간격으로 restTick 을 보낸다.
 */
export const useWorkoutSession = (plan: WorkoutPlan) => {
  const [state, dispatch] = useReducer(workoutReducer, plan, createWorkout);

  useInterval(() => dispatch({type: 'restTick'}), state.phase === 'rest' ? 1000 : null);

  const start = useCallback(() => dispatch({type: 'start'}), []);
  const count = useCallback((n: number) => dispatch({type: 'count', count: n}), []);
  const finishSet = useCallback(() => dispatch({type: 'finishSet'}), []);
  const skipRest = useCallback(() => dispatch({type: 'skipRest'}), []);
  const target = useMemo(() => targetFor(state), [state]);

  return {state, target, start, count, finishSet, skipRest};
};
