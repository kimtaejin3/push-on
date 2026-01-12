-- 1.5.2 버전 정보 추가
-- 업데이트 노트 모달 버그 수정 버전
-- 이 SQL을 Supabase SQL Editor에서 실행하세요

INSERT INTO app_versions (version, force_update, release_notes)
VALUES (
  '1.5.2',
  false,
  '🎯 주요 개선사항

• 버그 수정
  - 최신 버전인데도 업데이트 노트 모달이 표시되던 문제 수정
  - 업데이트 알림 기능 안정성 개선

• 텍스트 및 UI 개선
  - 앱 내 텍스트 오류 수정
  - 사용자 경험 개선을 위한 문구 개선'
) ON CONFLICT (version) DO UPDATE SET
  force_update = EXCLUDED.force_update,
  release_notes = EXCLUDED.release_notes,
  created_at = NOW();

