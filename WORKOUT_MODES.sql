-- 운동 모드(세트 / 100개 챌린지) 도입용 DB 변경. Supabase SQL Editor 에서 실행.
-- 구버전 앱 호환: 전부 기본값/nullable. 새 앱 배포 전에 실행해야 세트/프로그램 저장이 된다.

ALTER TABLE pushup_sets
  ADD COLUMN IF NOT EXISTS mode        text NOT NULL DEFAULT 'challenge', -- challenge | sets | program | program_test
  ADD COLUMN IF NOT EXISTS workout_id  uuid,      -- 한 번의 세트/프로그램 운동을 묶는 id (앱에서 생성)
  ADD COLUMN IF NOT EXISTS set_index   int,       -- 운동 내 세트 순번 (1부터)
  ADD COLUMN IF NOT EXISTS target_reps int;       -- 목표 횟수 (max 세트는 최소치)

CREATE TABLE IF NOT EXISTS pushup_programs (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status         text NOT NULL DEFAULT 'active',   -- active | completed | abandoned
  week           int  NOT NULL DEFAULT 1,           -- 1..6
  day            int  NOT NULL DEFAULT 1,           -- 1..3
  level          int  NOT NULL,                     -- 1..3 (현재 주차의 열)
  last_test_reps int  NOT NULL,                     -- 가장 최근 테스트 결과
  test_due       boolean NOT NULL DEFAULT false,    -- 다음 행동이 테스트인지
  completed_days jsonb NOT NULL DEFAULT '[]',       -- [{week, day, reps:[...], completed_at}]
  created_at     timestamptz DEFAULT now(),
  updated_at     timestamptz DEFAULT now()
);

ALTER TABLE pushup_programs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own programs" ON pushup_programs;
CREATE POLICY "own programs" ON pushup_programs
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS pushup_programs_user_active
  ON pushup_programs (user_id) WHERE status = 'active';
