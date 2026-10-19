-- 1.7.2 버전 정보 추가
-- 운동 중 홈 화면으로 튕기던 문제 수정
-- 이 SQL을 Supabase SQL Editor에서 실행하세요 (추가 스키마 변경 없음)

INSERT INTO app_versions (version, force_update, release_notes)
VALUES (
  '1.7.2',
  false,
  '🐛 버그 수정

• 운동 도중 갑자기 홈 화면으로 돌아가던 문제를 해결했어요
  - 세트 중간이나 휴식 중에 운동이 끊기지 않습니다'
) ON CONFLICT (version) DO UPDATE SET
  force_update = EXCLUDED.force_update,
  release_notes = EXCLUDED.release_notes,
  created_at = NOW();
