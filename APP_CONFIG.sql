-- 광고 원격 제어용 단일 행 설정 테이블. Supabase SQL Editor 에서 실행.
-- 기본값은 전부 꺼짐: 앱을 먼저 배포하고, 준비되면 이 행의 값을 바꿔 광고를 켠다.

CREATE TABLE IF NOT EXISTS app_config (
  id                           text PRIMARY KEY DEFAULT 'default',
  ads_enabled                  boolean NOT NULL DEFAULT false,
  interstitial_enabled         boolean NOT NULL DEFAULT false,
  interstitial_daily_cap       int     NOT NULL DEFAULT 2,
  interstitial_min_gap_seconds int     NOT NULL DEFAULT 180,
  interstitial_grace_workouts  int     NOT NULL DEFAULT 1,
  updated_at                   timestamptz DEFAULT now()
);

ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anyone can read app config" ON app_config;
CREATE POLICY "anyone can read app config" ON app_config FOR SELECT USING (true);

INSERT INTO app_config (id) VALUES ('default') ON CONFLICT (id) DO NOTHING;
