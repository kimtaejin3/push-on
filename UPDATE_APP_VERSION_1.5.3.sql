-- 1.5.3 버전 정보 추가
-- 온보딩 화면 버그 수정 버전
-- 이 SQL을 Supabase SQL Editor에서 실행하세요

INSERT INTO app_versions (version, force_update, release_notes)
VALUES (
  '1.5.3',
  false,
  '🎯 주요 개선사항

• 버그 수정
  - 앱 사용 경험 안정성 향상'
) ON CONFLICT (version) DO UPDATE SET
  force_update = EXCLUDED.force_update,
  release_notes = EXCLUDED.release_notes,
  created_at = NOW();

