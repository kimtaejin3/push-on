-- 1.7.3 버전 정보 추가
-- 순위 화면 1~3등 메달 테두리 + 1등 왕관 뱃지
-- 이 SQL을 Supabase SQL Editor에서 실행하세요 (추가 스키마 변경 없음)

INSERT INTO app_versions (version, force_update, release_notes)
VALUES (
  '1.7.3',
  false,
  '✨ 개선

• 순위 화면에서 1~3등을 한눈에 알아볼 수 있어요
  - 1·2·3등 프로필에 금·은·동 테두리가 생겼어요
  - 1등에는 왕관이 붙습니다'
) ON CONFLICT (version) DO UPDATE SET
  force_update = EXCLUDED.force_update,
  release_notes = EXCLUDED.release_notes,
  created_at = NOW();
