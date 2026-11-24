-- 리더보드 시드(가상 참여자) — pg_cron 이 매일 00:05(KST) 그날 합류할 시드와 그날 운동 기록을 만든다.
-- Supabase SQL Editor 에서 한 번 실행. 스위치(leaderboard_seeds_enabled)는 꺼진 채로 만들어진다.
--
-- 실제 데이터와의 분리
--   • 시드는 seed_* 테이블에만 있다. auth.users·profiles·pushup_sets·pushup_daily_totals 는 건드리지 않는다
--     → 가입자·리텐션·운동량 분석은 지금 쿼리 그대로 실제 사용자만 본다.
--   • seed_* 테이블은 RLS 를 켜고 정책을 두지 않아 앱(anon·authenticated)에서 직접 읽을 수 없다.
--   • 리더보드 함수 3개(일간·월간·연간)만 실제 집계에 시드를 더해 돌려준다. 반환 형태는 그대로라 앱 수정이 없다.
--   • 시드 비율·분포는 admin 스키마의 뷰로 본다(API 에 노출되지 않는 스키마).
--
-- 매일 하는 일 (seed_generate_day)
--   • 합류 기간(기본 30일) 동안 하루 2~3명이 새로 합류한다.
--   • 남아 있는 시드마다 페르소나 규칙으로 그날 운동할지·몇 개·몇 시에 할지 정한다. 그 시각이 지나야 리더보드에 보인다.
--   • 합류 기간이 끝나면 새 시드는 없고, 남은 시드가 하루 3%씩 자연스럽게 그만둔다.
--   • 시드 한 명의 한 달 합계는 1,500개를 넘지 않는다.
--   • 설정(seed_config)·페르소나(seed_personas)·닉네임(seed_users)을 바꾸면 다음 실행부터 반영된다.

-- ─────────────────────────────────────────────────────────────
-- 0. 확장·스위치
-- ─────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
ALTER TABLE app_config ADD COLUMN IF NOT EXISTS leaderboard_seeds_enabled boolean NOT NULL DEFAULT false;

-- ─────────────────────────────────────────────────────────────
-- 1. 설정·페르소나·시드 테이블
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS seed_config (
  id                 text PRIMARY KEY DEFAULT 'default',
  start_day          date NOT NULL DEFAULT (now() AT TIME ZONE 'Asia/Seoul')::date,  -- 합류 1일차
  join_days          int  NOT NULL DEFAULT 30,     -- 새 시드가 들어오는 기간
  join_min           int  NOT NULL DEFAULT 2,      -- 하루 합류 최소
  join_max           int  NOT NULL DEFAULT 3,      -- 하루 합류 최대
  month_cap          int  NOT NULL DEFAULT 1500,   -- 시드 한 명의 한 달 합계 상한
  after_churn_daily  real NOT NULL DEFAULT 0.03,   -- 합류 기간이 끝난 뒤 하루 이탈 확률
  generating         boolean NOT NULL DEFAULT true -- false 면 매일 작업이 아무것도 만들지 않는다
);
INSERT INTO seed_config (id) VALUES ('default') ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS seed_personas (
  persona        text PRIMARY KEY,
  label          text NOT NULL,
  weight         real NOT NULL,   -- 새 시드가 이 페르소나일 비율
  p_day          real NOT NULL,   -- 운동하는 날 비율
  base_min       int  NOT NULL,   -- 시작 개수 범위
  base_max       int  NOT NULL,
  weekly_growth  real NOT NULL,   -- 주당 증가율 (challenge 는 아래 weekly_add 사용)
  weekly_add     int  NOT NULL DEFAULT 0,
  cap_daily      int  NOT NULL,   -- 하루 최대
  hour_from      int  NOT NULL,   -- 운동 시간대 (KST)
  hour_to        int  NOT NULL,
  weekend_factor real NOT NULL DEFAULT 1,
  churn_p        real NOT NULL    -- 합류 3~14일 사이 그만둘 확률
);
INSERT INTO seed_personas VALUES
  ('office',    '퇴근 후 직장인',      0.30, 0.55, 30, 60, 1.03, 0,  80, 19, 23, 0.4, 0.35),
  ('student',   '대학생·취준생',       0.20, 0.45, 20, 60, 1.02, 0,  90, 13, 24, 1.0, 0.40),
  ('challenge', '100개 챌린지 입문',   0.18, 0.80, 25, 40, 1.00, 12, 100, 7, 23, 1.0, 0.30),
  ('hometrain', '꾸준한 홈트',         0.15, 0.90, 50, 90, 1.02, 0, 110,  6, 10, 1.0, 0.10),
  ('military',  '입대·체력시험 준비',  0.12, 0.85, 60, 90, 1.05, 0, 120,  6, 22, 1.0, 0.15),
  ('master',    '고수',                0.05, 0.70, 90, 110, 1.00, 0, 120,  5, 23, 1.0, 0.05)
ON CONFLICT (persona) DO NOTHING;

CREATE TABLE IF NOT EXISTS seed_users (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nickname   text NOT NULL UNIQUE,
  persona    text NOT NULL REFERENCES seed_personas(persona),
  base_reps  int  NOT NULL,          -- 이 시드의 시작 개수
  joined_on  date NOT NULL,          -- 합류일 (KST)
  churn_on   date,                   -- 마지막 운동 가능일. null = 계속
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS seed_workouts (
  seed_id    uuid NOT NULL REFERENCES seed_users(id) ON DELETE CASCADE,
  workout_at timestamptz NOT NULL,   -- 이 시각이 지나야 리더보드에 보인다
  reps       int NOT NULL CHECK (reps > 0),
  PRIMARY KEY (seed_id, workout_at)
);
CREATE INDEX IF NOT EXISTS seed_workouts_at_idx ON seed_workouts (workout_at);

-- 날짜별 실행 기록 — 같은 날 두 번 돌아도 한 번만 만든다
CREATE TABLE IF NOT EXISTS seed_runs (
  day       date PRIMARY KEY,
  joined    int NOT NULL,
  workouts  int NOT NULL,
  ran_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE seed_config   ENABLE ROW LEVEL SECURITY;
ALTER TABLE seed_personas ENABLE ROW LEVEL SECURITY;
ALTER TABLE seed_users    ENABLE ROW LEVEL SECURITY;
ALTER TABLE seed_workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE seed_runs     ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON seed_config, seed_personas, seed_users, seed_workouts, seed_runs FROM anon, authenticated;

-- ─────────────────────────────────────────────────────────────
-- 2. 하루치 생성 함수 (pg_cron 이 매일 부른다)
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION seed_new_nickname()
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  adjs  text[] := ARRAY['새벽','퇴근후','매일','꾸준','불꽃','근육','작심삼일','오늘도','하루한번','무쇠',
                        '헬린이','홈트','아침','야근후','주말','강철','열정','느긋한','도전','튼튼'];
  nouns text[] := ARRAY['푸쉬업','팔굽혀','곰','다람쥐','감자','고양이','거북이','호랑이','직장인','대학생',
                        '토끼','펭귄','루키','챌린저','운동러','근육맨','두부','만두','콩떡','청년'];
  alnum text := 'abcdefghijklmnopqrstuvwxyz0123456789';
  nick  text;
  k     int;
BEGIN
  FOR tries IN 1..50 LOOP
    -- 절반은 기본 닉네임(user-xxxxxxxx), 절반은 한글 별명 — 실제 사용자 닉네임 비율과 비슷하게
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
    IF NOT EXISTS (SELECT 1 FROM seed_users WHERE nickname = nick)
       AND NOT EXISTS (SELECT 1 FROM profiles WHERE nickname = nick) THEN
      RETURN nick;
    END IF;
  END LOOP;
  RETURN nick || floor(random() * 10000)::int::text;
END;
$$;

CREATE OR REPLACE FUNCTION seed_generate_day(target date DEFAULT (now() AT TIME ZONE 'Asia/Seoul')::date)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cfg       seed_config%ROWTYPE;
  per       seed_personas%ROWTYPE;
  su        record;
  day_index int;
  n_join    int;
  r         float;
  acc       float;
  total_w   float;
  joined    int := 0;
  made      int := 0;
  weeks     int;
  v_reps    int;
  p         float;
  month_sum int;
  hh        int;
  mm        int;
BEGIN
  SELECT * INTO cfg FROM seed_config WHERE id = 'default';
  IF NOT FOUND OR NOT cfg.generating THEN
    RETURN 'skipped: generating off';
  END IF;
  IF target < cfg.start_day THEN
    RETURN 'skipped: before start_day';
  END IF;
  IF EXISTS (SELECT 1 FROM seed_runs WHERE day = target) THEN
    RETURN 'skipped: already ran';
  END IF;

  day_index := target - cfg.start_day;   -- 0 = 1일차

  -- 1) 새 시드 합류 (합류 기간 안에서만)
  IF day_index < cfg.join_days THEN
    n_join := cfg.join_min + floor(random() * (cfg.join_max - cfg.join_min + 1))::int;
    SELECT sum(weight) INTO total_w FROM seed_personas;
    FOR i IN 1..n_join LOOP
      r := random() * total_w;
      acc := 0;
      FOR per IN SELECT * FROM seed_personas ORDER BY persona LOOP
        acc := acc + per.weight;
        EXIT WHEN r <= acc;
      END LOOP;
      INSERT INTO seed_users (nickname, persona, base_reps, joined_on, churn_on)
      VALUES (
        seed_new_nickname(),
        per.persona,
        per.base_min + floor(random() * (per.base_max - per.base_min + 1))::int,
        target,
        CASE WHEN random() < per.churn_p THEN target + (3 + floor(random() * 12))::int ELSE NULL END
      );
      joined := joined + 1;
    END LOOP;
  ELSE
    -- 합류 기간이 끝나면 남은 시드가 조금씩 그만둔다
    UPDATE seed_users
    SET churn_on = target
    WHERE churn_on IS NULL AND random() < cfg.after_churn_daily;
  END IF;

  -- 2) 오늘 운동 기록
  FOR su IN
    SELECT s.id, s.base_reps, s.joined_on, s.persona
    FROM seed_users s
    WHERE s.joined_on <= target AND (s.churn_on IS NULL OR s.churn_on >= target)
  LOOP
    SELECT * INTO per FROM seed_personas WHERE persona = su.persona;

    p := CASE WHEN su.joined_on = target THEN 0.9 ELSE per.p_day END;
    IF extract(isodow FROM target) >= 6 THEN
      p := p * per.weekend_factor;
    END IF;
    CONTINUE WHEN random() >= p;

    weeks := (target - su.joined_on) / 7;
    v_reps := round((su.base_reps + per.weekly_add * weeks) * power(per.weekly_growth, weeks))::int;
    v_reps := round(v_reps * (0.85 + random() * 0.3))::int;      -- 날마다 ±15%
    v_reps := greatest(5, least(v_reps, per.cap_daily));

    SELECT COALESCE(sum(w.reps), 0) INTO month_sum
    FROM seed_workouts w
    WHERE w.seed_id = su.id
      AND date_trunc('month', w.workout_at AT TIME ZONE 'Asia/Seoul') = date_trunc('month', target::timestamp);
    CONTINUE WHEN month_sum + v_reps > cfg.month_cap;

    hh := per.hour_from + floor(random() * (per.hour_to - per.hour_from))::int;
    mm := floor(random() * 60)::int;
    INSERT INTO seed_workouts (seed_id, workout_at, reps)
    VALUES (su.id, (target + make_interval(hours => hh, mins => mm)) AT TIME ZONE 'Asia/Seoul', v_reps)
    ON CONFLICT DO NOTHING;
    made := made + 1;
  END LOOP;

  INSERT INTO seed_runs (day, joined, workouts) VALUES (target, joined, made);
  RETURN format('day %s: joined %s, workouts %s', target, joined, made);
END;
$$;
REVOKE EXECUTE ON FUNCTION seed_generate_day(date) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION seed_new_nickname() FROM PUBLIC, anon, authenticated;

-- ─────────────────────────────────────────────────────────────
-- 3. 지금 보여도 되는 시드 기록 (스위치가 켜져 있고, 시각이 지난 것만)
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
-- 4. 리더보드 함수 — 원본을 admin.function_backups 에 보관한 뒤 교체
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

-- 일간 리더보드: 원본 SQL 이 저장소에 없어 인자 형태가 다를 수 있다 → 기존 것을 지우고 같은 이름·반환 형태로 다시 만든다
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
    AND date_trunc('month', w.workout_at AT TIME ZONE 'Asia/Seoul') = date_trunc('month', now() AT TIME ZONE 'Asia/Seoul')
  GROUP BY s.id, s.nickname, s.persona
) x;

REVOKE ALL ON ALL TABLES IN SCHEMA admin FROM PUBLIC, anon, authenticated;

-- ─────────────────────────────────────────────────────────────
-- 6. 매일 00:05 KST(= 15:05 UTC) 실행 등록, 오늘 치는 바로 만든다
-- ─────────────────────────────────────────────────────────────
SELECT cron.unschedule(jobid) FROM cron.job WHERE jobname = 'leaderboard-seeds-daily';
SELECT cron.schedule('leaderboard-seeds-daily', '5 15 * * *', $$SELECT public.seed_generate_day()$$);
SELECT seed_generate_day();

-- ─────────────────────────────────────────────────────────────
-- 운영 메모
--   확인:   SELECT * FROM seed_runs ORDER BY day DESC;
--           SELECT persona, count(*), count(churn_on) AS churned FROM seed_users GROUP BY persona;
--           SELECT * FROM admin.daily_activity_split LIMIT 7;
--           SELECT * FROM admin.monthly_leaderboard_split LIMIT 20;
--           SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 5;
--   켜기:   UPDATE app_config SET leaderboard_seeds_enabled = true  WHERE id = 'default';
--   끄기:   UPDATE app_config SET leaderboard_seeds_enabled = false WHERE id = 'default';
--   닉네임: UPDATE seed_users SET nickname = '새이름' WHERE nickname = '옛이름';
--   설정:   UPDATE seed_config SET join_max = 4 WHERE id = 'default';   -- 다음 실행부터
--   생성 멈춤: UPDATE seed_config SET generating = false WHERE id = 'default';
--   완전히 되돌리기:
--     SELECT cron.unschedule('leaderboard-seeds-daily');
--     UPDATE app_config SET leaderboard_seeds_enabled = false WHERE id = 'default';
--     SELECT name, def FROM admin.function_backups;   -- 원본 함수 정의를 복사해 다시 실행
--     DROP TABLE seed_workouts, seed_users, seed_runs, seed_personas, seed_config;
-- ─────────────────────────────────────────────────────────────
