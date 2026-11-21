-- 스트릭(연속 운동 일수) 계산용: 로그인한 본인이 운동한 날짜 목록. Supabase SQL Editor 에서 실행.
-- 호출자 권한으로 실행되므로 pushup_sets 의 기존 RLS 를 그대로 따른다. 테이블 변경 없음.
CREATE OR REPLACE FUNCTION get_my_workout_dates()
RETURNS text[]
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
  SELECT COALESCE(array_agg(d ORDER BY d), '{}')
  FROM (SELECT DISTINCT workout_date::text AS d FROM pushup_sets WHERE user_id = auth.uid()) t;
$$;

GRANT EXECUTE ON FUNCTION get_my_workout_dates() TO authenticated;
