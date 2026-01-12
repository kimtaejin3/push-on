-- 1.5.0 버전 정보 추가
-- 이 SQL을 Supabase SQL Editor에서 실행하세요

INSERT INTO app_versions (version, force_update, release_notes)
VALUES (
  '1.5.0',
  false,
  '자동 업데이트 알림 기능 추가
- 새 버전이 출시되면 자동으로 알림을 받을 수 있습니다
- 업데이트 노트를 앱에서 바로 확인할 수 있습니다
- 플레이스토어로 바로 이동하여 업데이트할 수 있습니다

리더보드 기능 강화
- 일일, 월간, 연간 순위를 한눈에 확인할 수 있습니다
- 리더보드 조회 속도가 빨라졌습니다
- 당겨서 새로고침으로 최신 순위를 바로 확인할 수 있습니다

설정 간소화
- 프로필 설정이 더 간단해졌습니다
- 처음 시작하는 분들을 위한 온보딩 과정이 개선되었습니다

전반적인 성능 개선
- 앱이 더 빠르고 안정적으로 작동합니다'
) ON CONFLICT (version) DO UPDATE SET
  force_update = EXCLUDED.force_update,
  release_notes = EXCLUDED.release_notes,
  created_at = NOW();

