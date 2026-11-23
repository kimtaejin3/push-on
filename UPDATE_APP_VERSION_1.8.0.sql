-- 1.8.0 버전 정보 추가 (강제 업데이트)
-- 100개 챌린지가 매일 7일 프로그램으로 바뀌어 옛 앱(1.7.x)은 Day 4~7 진행을 처리하지 못한다 → force_update true
-- ⚠️ Play 스토어에 1.8.0 이 실제로 공개된 뒤에 실행하세요. 먼저 실행하면 아직 받을 수 없는 버전으로 업데이트를 강제하게 됩니다.
-- 이 SQL을 Supabase SQL Editor에서 실행하세요 (STREAK.sql·APP_CONFIG.sql 은 이미 실행됨)

INSERT INTO app_versions (version, force_update, release_notes)
VALUES (
  '1.8.0',
  true,
  '✨ 새 디자인으로 다시 태어났어요

• 홈·운동·결과·기록·설정 화면이 모두 새로워졌어요
• 100개 챌린지가 매일 하는 7일 프로그램으로 바뀌고, 진행 경로를 한눈에 볼 수 있어요
• 연속 운동 일수(스트릭)와 하루 첫 운동 축하가 생겼어요
• 운동 중 일시정지·휴식 연장·휴식 뒤 자동 다음 세트, 운동 중 화면 꺼짐 방지
• 결과 화면에서 지난번 대비 기록과 한 세트 최고 기록을 보여줘요
• 기록과 통계를 한 화면에 모았어요
• 일부 화면에 광고가 표시될 수 있어요 (운동 중에는 나오지 않아요)'
) ON CONFLICT (version) DO UPDATE SET
  force_update = EXCLUDED.force_update,
  release_notes = EXCLUDED.release_notes,
  created_at = NOW();
