import {supabase} from '../lib/supabase';

/**
 * 로그인한 본인이 운동한 날짜 목록('YYYY-MM-DD', 중복 없이 오름차순).
 * 서버에 함수(STREAK.sql)가 아직 없으면 error 로 throw 된다 — 호출하는 쪽은 스트릭을 숨긴다.
 */
export const getWorkoutDates = async (): Promise<string[]> => {
  const {data, error} = await supabase.rpc('get_my_workout_dates');
  if (error) {
    throw error;
  }
  return (data as string[] | null) ?? [];
};

// 서버에 함수가 없을 때의 오류 코드. PostgREST 가 스키마에서 못 찾으면 PGRST202,
// Postgres 까지 가서 없다고 하면 42883(undefined_function)
const MISSING_FUNCTION_CODES = ['PGRST202', '42883'];

/** 서버에 get_my_workout_dates 함수가 아직 없어서 난 오류인지. 다시 시도해도 소용없는 경우다. */
export const isMissingFunctionError = (error: unknown): boolean =>
  typeof error === 'object' &&
  error !== null &&
  MISSING_FUNCTION_CODES.includes(String((error as {code?: unknown}).code));

const MAX_WORKOUT_DATES_RETRIES = 2;

/**
 * 운동 날짜 조회의 재시도 정책(TanStack Query 의 retry).
 * 함수가 없으면 바로 멈추고, 그 밖의 오류(앱 시작 때 약한 네트워크 등)는 2번까지 다시 시도한다 —
 * 한 번 실패로 그 세션 내내 스트릭이 숨지 않도록.
 */
export const retryWorkoutDates = (failureCount: number, error: unknown): boolean =>
  !isMissingFunctionError(error) && failureCount < MAX_WORKOUT_DATES_RETRIES;
