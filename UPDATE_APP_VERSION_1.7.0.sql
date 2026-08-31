-- 1.7.0 버전 정보 추가
-- 운동 모드 3종(챌린지/세트/100개 챌린지) + 운동 알림 버전
-- 이 SQL을 Supabase SQL Editor에서 실행하세요
-- (WORKOUT_MODES.sql 은 이미 실행됨 — 추가 스키마 변경 없음)

INSERT INTO app_versions (version, force_update, release_notes)
VALUES (
  '1.7.0',
  false,
  '🎯 주요 개선사항

• 운동 모드 3종
  - 챌린지: 한 세트 최대 횟수 도전
  - 세트: 세트 수·목표·휴식을 정하면 자동으로 세트 진행
  - 100개 챌린지: 내 수준에 맞춘 세트로 연속 100개까지

• 운동 알림
  - 100개 챌린지 진행 중, 원하는 요일·시간에 알림을 받아보세요

• 기록 개선
  - 히스토리에서 운동 단위로 세트를 묶어서 보여줘요
  - 달력을 월/주 단위로 전환할 수 있어요
  - 리더보드에서 내 순위가 강조돼요'
) ON CONFLICT (version) DO UPDATE SET
  force_update = EXCLUDED.force_update,
  release_notes = EXCLUDED.release_notes,
  created_at = NOW();
