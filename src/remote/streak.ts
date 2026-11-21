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
