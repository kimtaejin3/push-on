-- 1.6.0 버전 정보 추가
-- 온보딩 제거 + 랜덤 닉네임 자동 부여 버전
-- 이 SQL을 Supabase SQL Editor에서 실행하세요 (앱 배포 전에 실행 권장)

-- 1) 세트당 목표 횟수는 앱에서 더 이상 사용하지 않는다.
--    구버전 앱(≤1.5.3)이 아직 값을 보내므로 컬럼은 남기되, 새 앱이 값을 안 보내도 되도록 NOT NULL 만 푼다.
--    (이미 nullable 이면 아무 일도 하지 않는다)
ALTER TABLE profiles ALTER COLUMN target_reps_per_set DROP NOT NULL;

-- 2) 앱 내 업데이트 알림용 버전 정보
INSERT INTO app_versions (version, force_update, release_notes)
VALUES (
  '1.6.0',
  false,
  '🎯 주요 개선사항

• 더 빠른 시작
  - 가입 직후 바로 사용할 수 있어요 (온보딩 입력 단계 제거)
  - 닉네임은 자동으로 만들어지고, 프로필 수정에서 언제든 바꿀 수 있어요

• 버그 수정
  - 로그아웃 / 회원 탈퇴가 정상 동작하지 않던 문제 해결
  - 앱 시작 화면에서 멈추던 문제 해결'
) ON CONFLICT (version) DO UPDATE SET
  force_update = EXCLUDED.force_update,
  release_notes = EXCLUDED.release_notes,
  created_at = NOW();
