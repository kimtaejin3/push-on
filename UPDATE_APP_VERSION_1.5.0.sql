-- 1.5.0 버전 정보 수정/추가
-- 이미 레코드가 있으면 업데이트, 없으면 추가
-- 이 SQL을 Supabase SQL Editor에서 실행하세요

INSERT INTO app_versions (version, force_update, release_notes)
VALUES (
  '1.5.0',
  true,
  '🎯 주요 개선사항

• 자동 업데이트 알림 기능 추가
  - 새 버전이 출시되면 자동으로 알림을 받을 수 있습니다
  - 업데이트 노트를 앱에서 바로 확인할 수 있습니다
  - 플레이스토어로 바로 이동하여 업데이트할 수 있습니다'
) ON CONFLICT (version) DO UPDATE SET
  force_update = EXCLUDED.force_update,
  release_notes = EXCLUDED.release_notes,
  created_at = NOW();

