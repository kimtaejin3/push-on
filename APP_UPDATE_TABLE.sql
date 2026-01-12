-- 앱 버전 정보 테이블 생성
-- 이 테이블에 새 버전 정보를 추가하면, 기존 앱이 자동으로 업데이트 알림을 표시합니다.

CREATE TABLE IF NOT EXISTS app_versions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  version TEXT NOT NULL UNIQUE, -- 버전 번호 (예: "0.0.1", "0.0.2")
  force_update BOOLEAN DEFAULT false, -- 강제 업데이트 여부 (true면 앱 사용 불가)
  release_notes TEXT, -- 업데이트 노트 (마크다운 또는 텍스트)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS (Row Level Security) 정책 설정
-- 모든 사용자가 읽을 수 있도록 설정 (인증 불필요)
ALTER TABLE app_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read app versions" ON app_versions
  FOR SELECT USING (true);

-- 초기 데이터 삽입 (현재 버전)
-- 실제 현재 버전으로 수정하세요
INSERT INTO app_versions (version, force_update, release_notes)
VALUES (
  '0.0.1',
  false,
  '초기 버전'
) ON CONFLICT (version) DO NOTHING;

-- 새 버전 출시 시 사용 예시:
-- INSERT INTO app_versions (version, force_update, release_notes)
-- VALUES (
--   '0.0.2',
--   false,
--   '리더보드 기능 강화
-- - 일일, 월간, 연간 순위를 한눈에 확인할 수 있습니다
-- - 리더보드 조회 속도가 빨라졌습니다
-- - 당겨서 새로고침으로 최신 순위를 바로 확인할 수 있습니다'
-- );

