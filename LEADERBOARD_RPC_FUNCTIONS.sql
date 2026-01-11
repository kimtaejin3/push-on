-- 월간 리더보드 RPC 함수
-- 특정 연도/월의 모든 사용자들의 푸쉬업 횟수를 집계하여 반환
CREATE OR REPLACE FUNCTION get_monthly_leaderboard(
  p_year INTEGER,
  p_month INTEGER
)
RETURNS TABLE (
  user_id UUID,
  nickname TEXT,
  total_reps BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pdt.user_id,
    p.nickname,
    SUM(pdt.total_reps)::BIGINT as total_reps
  FROM pushup_daily_totals pdt
  INNER JOIN profiles p ON p.id = pdt.user_id
  WHERE EXTRACT(YEAR FROM pdt.date) = p_year
    AND EXTRACT(MONTH FROM pdt.date) = p_month
  GROUP BY pdt.user_id, p.nickname
  ORDER BY total_reps DESC
  LIMIT 100;
END;
$$;

-- 연간 리더보드 RPC 함수
-- 특정 연도의 모든 사용자들의 푸쉬업 횟수를 집계하여 반환
CREATE OR REPLACE FUNCTION get_yearly_leaderboard(
  p_year INTEGER
)
RETURNS TABLE (
  user_id UUID,
  nickname TEXT,
  total_reps BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pdt.user_id,
    p.nickname,
    SUM(pdt.total_reps)::BIGINT as total_reps
  FROM pushup_daily_totals pdt
  INNER JOIN profiles p ON p.id = pdt.user_id
  WHERE EXTRACT(YEAR FROM pdt.date) = p_year
  GROUP BY pdt.user_id, p.nickname
  ORDER BY total_reps DESC
  LIMIT 100;
END;
$$;

-- RLS 정책 설정 (필요한 경우)
-- RPC 함수는 SECURITY DEFINER로 실행되므로 RLS를 우회합니다.
-- 모든 사용자가 리더보드를 조회할 수 있도록 설정되어 있습니다.

