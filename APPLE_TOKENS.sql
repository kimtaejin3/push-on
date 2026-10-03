-- 애플 로그인 사용자의 refresh token 저장소.
-- 회원 탈퇴 시 애플 토큰을 revoke 하라는 App Store 가이드라인 5.1.1(v) 대응용.
-- Supabase SQL Editor 에서 실행하세요.

CREATE TABLE IF NOT EXISTS apple_tokens (
  user_id       uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  refresh_token text NOT NULL,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

-- 사용자 토큰이므로 일반 사용자는 읽을 수 없다. Edge Function 의 service_role 만 접근한다.
ALTER TABLE apple_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "no client access" ON apple_tokens;
-- 정책을 하나도 만들지 않으면 anon/authenticated 는 모두 차단되고 service_role 만 통과한다.
