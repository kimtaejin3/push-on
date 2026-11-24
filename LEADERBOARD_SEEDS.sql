-- 리더보드 시드(가상 참여자) — 30일 동안 하루 2~3명이 새로 합류해 페르소나별로 운동하는 것처럼 보이게 한다.
-- Supabase SQL Editor 에서 한 번 실행. 실행해도 스위치(leaderboard_seeds_enabled)는 꺼진 채로 만들어진다.
--
-- 실제 데이터와의 분리
--   • 시드는 seed_users / seed_workouts 두 테이블에만 있다. auth.users·profiles·pushup_sets·pushup_daily_totals 는 건드리지 않는다
--     → 가입자·리텐션·운동량 분석은 지금 쿼리 그대로 실제 사용자만 본다.
--   • 두 테이블은 RLS 를 켜고 정책을 두지 않아 앱(anon·authenticated)에서 직접 읽을 수 없다.
--   • 리더보드 함수 3개(일간·월간·연간)만 실제 집계에 시드를 더해 돌려준다. 반환 형태는 그대로라 앱 수정이 없다.
--   • 시드 비율·분포는 admin 스키마의 뷰로 본다(API 에 노출되지 않는 스키마).
--
-- 자연스럽게 보이게
--   • 운동마다 시각(workout_at)을 두고, 그 시각이 지난 기록만 보인다 → 하루 동안 순위가 조금씩 움직인다.
--   • 페르소나 6종(빈도·개수·시간대·성장·이탈이 다름). 시드 한 명의 한 달 합계는 1,500개를 넘지 않는다.
--   • 난수 시드를 고정해, 같은 날 다시 만들면 같은 데이터가 나온다.

-- ─────────────────────────────────────────────────────────────
-- 0. 스위치 (기본 꺼짐)
-- ─────────────────────────────────────────────────────────────
ALTER TABLE app_config ADD COLUMN IF NOT EXISTS leaderboard_seeds_enabled boolean NOT NULL DEFAULT false;

-- ─────────────────────────────────────────────────────────────
-- 1. 시드 테이블
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS seed_users (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nickname   text NOT NULL UNIQUE,
  persona    text NOT NULL,           -- office | student | challenge | hometrain | military | master
  joined_on  date NOT NULL,           -- 합류일 (KST)
  churn_on   date,                    -- 마지막 운동 가능일. null = 끝까지 남음
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS seed_workouts (
  seed_id    uuid NOT NULL REFERENCES seed_users(id) ON DELETE CASCADE,
  workout_at timestamptz NOT NULL,    -- 이 시각이 지나야 리더보드에 보인다
  reps       int NOT NULL CHECK (reps > 0),
  PRIMARY KEY (seed_id, workout_at)
);
CREATE INDEX IF NOT EXISTS seed_workouts_at_idx ON seed_workouts (workout_at);

ALTER TABLE seed_users    ENABLE ROW LEVEL SECURITY;
ALTER TABLE seed_workouts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON seed_users, seed_workouts FROM anon, authenticated;

-- ─────────────────────────────────────────────────────────────
-- 2. 데이터 생성 (이미 있으면 건너뜀)
-- ─────────────────────────────────────────────────────────────
DO $$
DECLARE
  start_day  date := (now() AT TIME ZONE 'Asia/Seoul')::date;   -- 실행한 날이 1일차
  total_days int  := 30;
  month_cap  int  := 1500;                                       -- 시드 한 명의 한 달 합계 상한
  adjs  text[] := ARRAY['새벽','퇴근후','매일','꾸준','불꽃','근육','작심삼일','오늘도','하루한번','무쇠',
                        '헬린이','홈트','아침','야근후','주말','강철','열정','느긋한','도전','튼튼'];
  nouns text[] := ARRAY['푸쉬업','팔굽혀','곰','다람쥐','감자','고양이','거북이','호랑이','직장인','대학생',
                        '토끼','펭귄','루키','챌린저','운동러','근육맨','두부','만두','콩떡','청년'];
  alnum text := 'abcdefghijklmnopqrstuvwxyz0123456789';
  d int; i int; k int; n int; tries int;
  r float; persona text; nick text; sid uuid;
  join_day date; churn date; cur date; dow int;
  p_day float; base int; growth float; cap_daily int; h_lo int; h_hi int; churn_p float;
  weeks int; reps int; hh int; mm int; month_sum int;
BEGIN
  IF EXISTS (SELECT 1 FROM seed_users) THEN
    RAISE NOTICE '시드가 이미 있어 생성을 건너뜁니다';
    RETURN;
  END IF;

  PERFORM setseed(0.4242);

  FOR d IN 0..total_days - 1 LOOP
    join_day := start_day + d;
    n := 2 + floor(random() * 2)::int;                          -- 하루 2~3명

    FOR i IN 1..n LOOP
      -- 페르소나: 직장인 30 · 학생 20 · 100개 챌린지 18 · 홈트 15 · 입대·체력시험 12 · 고수 5 (%)
      r := random();
      persona := CASE WHEN r < 0.30 THEN 'office'   WHEN r < 0.50 THEN 'student'
                      WHEN r < 0.68 THEN 'challenge' WHEN r < 0.83 THEN 'hometrain'
                      WHEN r < 0.95 THEN 'military'  ELSE 'master' END;

      -- p_day: 운동하는 날 비율, base: 시작 개수, growth: 주당 증가율, h_lo~h_hi: 운동 시간대, churn_p: 중도 이탈 확률
      CASE persona
        WHEN 'office'    THEN p_day := 0.55; base := 30 + floor(random()*31)::int; growth := 1.03; cap_daily := 80;  h_lo := 19; h_hi := 23; churn_p := 0.35;
        WHEN 'student'   THEN p_day := 0.45; base := 20 + floor(random()*41)::int; growth := 1.02; cap_daily := 90;  h_lo := 13; h_hi := 24; churn_p := 0.40;
        WHEN 'challenge' THEN p_day := 0.80; base := 25 + floor(random()*16)::int; growth := 1.00; cap_daily := 100; h_lo := 7;  h_hi := 23; churn_p := 0.30;
        WHEN 'hometrain' THEN p_day := 0.90; base := 50 + floor(random()*41)::int; growth := 1.02; cap_daily := 110; h_lo := 6;  h_hi := 10; churn_p := 0.10;
        WHEN 'military'  THEN p_day := 0.85; base := 60 + floor(random()*31)::int; growth := 1.05; cap_daily := 120; h_lo := 6;  h_hi := 22; churn_p := 0.15;
        ELSE                  p_day := 0.70; base := 90 + floor(random()*21)::int; growth := 1.00; cap_daily := 120; h_lo := 5;  h_hi := 23; churn_p := 0.05;
      END CASE;

      -- 닉네임: 절반은 기본 닉네임(user-xxxxxxxx), 절반은 한글 별명. 실제 사용자·다른 시드와 겹치지 않게
      tries := 0;
      LOOP
        tries := tries + 1;
        IF random() < 0.5 THEN
          nick := 'user-';
          FOR k IN 1..8 LOOP
            nick := nick || substr(alnum, 1 + floor(random() * 36)::int, 1);
          END LOOP;
        ELSE
          nick := adjs[1 + floor(random() * array_length(adjs, 1))::int]
               || nouns[1 + floor(random() * array_length(nouns, 1))::int]
               || CASE WHEN random() < 0.35 THEN (1 + floor(random() * 99))::int::text ELSE '' END;
        END IF;
        EXIT WHEN NOT EXISTS (SELECT 1 FROM seed_users WHERE nickname = nick)
              AND NOT EXISTS (SELECT 1 FROM profiles   WHERE nickname = nick);
        IF tries > 50 THEN
          nick := nick || floor(random() * 1000)::int::text;
          EXIT;
        END IF;
      END LOOP;

      -- 이탈: 합류 3~14일 뒤 그만둠 (페르소나별 확률)
      churn := CASE WHEN random() < churn_p THEN join_day + (3 + floor(random() * 12))::int ELSE NULL END;

      INSERT INTO seed_users (nickname, persona, joined_on, churn_on)
      VALUES (nick, persona, join_day, churn)
      RETURNING id INTO sid;

      -- 운동 기록: 합류일부터 30일 끝까지(이탈하면 그날까지)
      cur := join_day;
      WHILE cur <= start_day + total_days - 1 LOOP
        EXIT WHEN churn IS NOT NULL AND cur > churn;
        dow := extract(isodow FROM cur)::int;                    -- 6·7 = 주말

        IF (cur = join_day AND random() < 0.9)
           OR (cur > join_day AND random() < p_day * CASE WHEN persona = 'office' AND dow >= 6 THEN 0.4 ELSE 1 END) THEN
          weeks := (cur - join_day) / 7;
          IF persona = 'challenge' THEN
            reps := base + weeks * 12;                            -- 100개 챌린지 표처럼 주마다 늘어남
          ELSE
            reps := round(base * power(growth, weeks))::int;
          END IF;
          reps := round(reps * (0.85 + random() * 0.3))::int;     -- 날마다 ±15%
          reps := greatest(5, least(reps, cap_daily));

          -- 한 달 합계 상한 (KST 달 기준)
          SELECT COALESCE(sum(w.reps), 0) INTO month_sum
          FROM seed_workouts w
          WHERE w.seed_id = sid
            AND date_trunc('month', (w.workout_at AT TIME ZONE 'Asia/Seoul')) = date_trunc('month', cur::timestamp);

          IF month_sum + reps <= month_cap THEN
            hh := h_lo + floor(random() * (h_hi - h_lo))::int;
            mm := floor(random() * 60)::int;
            INSERT INTO seed_workouts (seed_id, workout_at, reps)
            VALUES (sid, (cur + make_interval(hours => hh, mins => mm)) AT TIME ZONE 'Asia/Seoul', reps)
            ON CONFLICT DO NOTHING;
          END IF;
        END IF;

        cur := cur + 1;
      END LOOP;
    END LOOP;
  END LOOP;
END $$;

-- ─────────────────────────────────────────────────────────────
-- 3. 지금 보여도 되는 시드 기록 (스위치가 켜져 있고, 시각이 지난 것만)
--    앱에서는 직접 부를 수 없고, 아래 리더보드 함수 안에서만 쓴다
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION seed_daily_totals_visible()
RETURNS TABLE (seed_id uuid, nickname text, day date, reps bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT s.id, s.nickname, (w.workout_at AT TIME ZONE 'Asia/Seoul')::date, sum(w.reps)::bigint
  FROM seed_workouts w
  JOIN seed_users s ON s.id = w.seed_id
  WHERE w.workout_at <= now()
    AND COALESCE((SELECT c.leaderboard_seeds_enabled FROM app_config c WHERE c.id = 'default'), false)
  GROUP BY s.id, s.nickname, (w.workout_at AT TIME ZONE 'Asia/Seoul')::date;
$$;
REVOKE EXECUTE ON FUNCTION seed_daily_totals_visible() FROM PUBLIC, anon, authenticated;

-- ─────────────────────────────────────────────────────────────
-- 4. 리더보드 함수 — 실행 전 원본을 admin.function_backups 에 보관한 뒤 교체
-- ─────────────────────────────────────────────────────────────
CREATE SCHEMA IF NOT EXISTS admin;
REVOKE ALL ON SCHEMA admin FROM PUBLIC, anon, authenticated;

CREATE TABLE IF NOT EXISTS admin.function_backups (
  name     text NOT NULL,
  def      text NOT NULL,
  saved_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO admin.function_backups (name, def)
SELECT p.proname, pg_get_functiondef(p.oid)
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN ('get_leaderboard', 'get_monthly_leaderboard', 'get_yearly_leaderboard')
  AND NOT EXISTS (SELECT 1 FROM admin.function_backups b WHERE b.name = p.proname);

-- 일간 리더보드: 원본 SQL 이 저장소에 없어 인자 형태가 다를 수 있다 → 기존 것을 모두 지우고 같은 이름·반환 형태로 다시 만든다
DO $$
DECLARE f record;
BEGIN
  FOR f IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'get_leaderboard'
  LOOP
    EXECUTE 'DROP FUNCTION ' || f.sig;
  END LOOP;
END $$;

CREATE FUNCTION get_leaderboard(target_date date)
RETURNS TABLE (user_id uuid, nickname text, total_reps bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT t.uid, t.nick, t.reps
  FROM (
    SELECT pdt.user_id AS uid, p.nickname AS nick, sum(pdt.total_reps)::bigint AS reps
    FROM pushup_daily_totals pdt
    JOIN profiles p ON p.id = pdt.user_id
    WHERE pdt.date = target_date
    GROUP BY pdt.user_id, p.nickname
    UNION ALL
    SELECT s.seed_id, s.nickname, s.reps
    FROM seed_daily_totals_visible() s
    WHERE s.day = target_date
  ) t
  WHERE t.reps > 0
  ORDER BY t.reps DESC
  LIMIT 100;
END;
$$;

CREATE OR REPLACE FUNCTION get_monthly_leaderboard(p_year integer, p_month integer)
RETURNS TABLE (user_id uuid, nickname text, total_reps bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT t.uid, t.nick, t.reps
  FROM (
    SELECT pdt.user_id AS uid, p.nickname AS nick, sum(pdt.total_reps)::bigint AS reps
    FROM pushup_daily_totals pdt
    JOIN profiles p ON p.id = pdt.user_id
    WHERE extract(year FROM pdt.date) = p_year AND extract(month FROM pdt.date) = p_month
    GROUP BY pdt.user_id, p.nickname
    UNION ALL
    SELECT s.seed_id, s.nickname, sum(s.reps)::bigint
    FROM seed_daily_totals_visible() s
    WHERE extract(year FROM s.day) = p_year AND extract(month FROM s.day) = p_month
    GROUP BY s.seed_id, s.nickname
  ) t
  ORDER BY t.reps DESC
  LIMIT 100;
END;
$$;

CREATE OR REPLACE FUNCTION get_yearly_leaderboard(p_year integer)
RETURNS TABLE (user_id uuid, nickname text, total_reps bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT t.uid, t.nick, t.reps
  FROM (
    SELECT pdt.user_id AS uid, p.nickname AS nick, sum(pdt.total_reps)::bigint AS reps
    FROM pushup_daily_totals pdt
    JOIN profiles p ON p.id = pdt.user_id
    WHERE extract(year FROM pdt.date) = p_year
    GROUP BY pdt.user_id, p.nickname
    UNION ALL
    SELECT s.seed_id, s.nickname, sum(s.reps)::bigint
    FROM seed_daily_totals_visible() s
    WHERE extract(year FROM s.day) = p_year
    GROUP BY s.seed_id, s.nickname
  ) t
  ORDER BY t.reps DESC
  LIMIT 100;
END;
$$;

GRANT EXECUTE ON FUNCTION get_leaderboard(date) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_monthly_leaderboard(integer, integer) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_yearly_leaderboard(integer) TO anon, authenticated;

-- ─────────────────────────────────────────────────────────────
-- 5. 분석용 뷰 (admin 스키마 — 앱 API 에 노출되지 않음, SQL Editor 에서만 조회)
-- ─────────────────────────────────────────────────────────────
-- 날짜별 실제 vs 시드 활동 (시각이 지난 시드 기록만)
CREATE OR REPLACE VIEW admin.daily_activity_split AS
SELECT day,
       sum(CASE WHEN is_seed THEN 0 ELSE 1 END) AS real_active_users,
       sum(CASE WHEN is_seed THEN 1 ELSE 0 END) AS seed_active_users,
       sum(CASE WHEN is_seed THEN 0 ELSE reps END) AS real_reps,
       sum(CASE WHEN is_seed THEN reps ELSE 0 END) AS seed_reps
FROM (
  SELECT pdt.date AS day, false AS is_seed, sum(pdt.total_reps)::bigint AS reps
  FROM pushup_daily_totals pdt GROUP BY pdt.date, pdt.user_id
  UNION ALL
  SELECT (w.workout_at AT TIME ZONE 'Asia/Seoul')::date, true, sum(w.reps)::bigint
  FROM seed_workouts w WHERE w.workout_at <= now()
  GROUP BY (w.workout_at AT TIME ZONE 'Asia/Seoul')::date, w.seed_id
) x
GROUP BY day
ORDER BY day DESC;

-- 이번 달 리더보드를 실제/시드 구분해서 (앱에 보이는 순위와 같은 순서)
CREATE OR REPLACE VIEW admin.monthly_leaderboard_split AS
SELECT rank() OVER (ORDER BY reps DESC) AS rank, is_seed, nickname, persona, reps
FROM (
  SELECT false AS is_seed, p.nickname, NULL::text AS persona, sum(pdt.total_reps)::bigint AS reps
  FROM pushup_daily_totals pdt JOIN profiles p ON p.id = pdt.user_id
  WHERE date_trunc('month', pdt.date) = date_trunc('month', (now() AT TIME ZONE 'Asia/Seoul')::date)
  GROUP BY p.id, p.nickname
  UNION ALL
  SELECT true, s.nickname, s.persona, sum(w.reps)::bigint
  FROM seed_workouts w JOIN seed_users s ON s.id = w.seed_id
  WHERE w.workout_at <= now()
    AND date_trunc('month', (w.workout_at AT TIME ZONE 'Asia/Seoul')) = date_trunc('month', (now() AT TIME ZONE 'Asia/Seoul'))
  GROUP BY s.id, s.nickname, s.persona
) x;

REVOKE ALL ON ALL TABLES IN SCHEMA admin FROM PUBLIC, anon, authenticated;

-- ─────────────────────────────────────────────────────────────
-- 실행 뒤 확인 (SQL Editor 에서)
--   SELECT persona, count(*), count(churn_on) AS churned FROM seed_users GROUP BY persona;
--   SELECT * FROM admin.daily_activity_split LIMIT 7;
--   SELECT * FROM admin.monthly_leaderboard_split LIMIT 20;
--
-- 켜기 / 끄기 (앱 수정 없이 즉시 반영)
--   UPDATE app_config SET leaderboard_seeds_enabled = true  WHERE id = 'default';
--   UPDATE app_config SET leaderboard_seeds_enabled = false WHERE id = 'default';
--
-- 완전히 되돌리기
--   UPDATE app_config SET leaderboard_seeds_enabled = false WHERE id = 'default';
--   SELECT name, def FROM admin.function_backups;   -- 원본 함수 정의를 복사해 다시 실행
--   DROP TABLE seed_workouts; DROP TABLE seed_users; DROP FUNCTION seed_daily_totals_visible();
-- ─────────────────────────────────────────────────────────────
