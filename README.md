# Push On (푸쉬온)

폰을 바닥에 두고 푸쉬업만 하면, 얼굴 추적으로 횟수를 자동으로 세어주는 운동 앱입니다.
손으로 세거나 화면을 볼 필요 없이 운동에만 집중하고, 기록·통계·리더보드로 꾸준함을 만듭니다.

- [구글 플레이 스토어](https://play.google.com/store/apps/details?id=com.pushupapp)
- 앱스토어 출시 예정

## 데모

https://github.com/user-attachments/assets/d6d2975c-e237-4113-a955-a2bb034417e9

## 주요 기능

### 자동 카운팅

기기를 얼굴과 마주 보게 바닥에 두고 시작하면, 전면 카메라의 얼굴 추적으로 내려갔다 올라오는
동작을 인식해 한 개씩 카운트합니다. 개수가 올라갈 때마다 진동으로 알려줍니다.

- iOS: ARKit `ARFaceAnchor` 와 카메라 사이 거리 변화로 판정
- Android: ARCore Augmented Faces
- 카메라 영상은 기기 안에서만 처리하고 서버로 보내지 않습니다

### 운동 모드 3종

| 모드 | 설명 |
|---|---|
| **챌린지** | 한 세트에 몇 개까지 되는지 최대 횟수 도전 |
| **세트** | 세트 수 · 목표 횟수 · 휴식 시간을 정하면 목표 도달 시 자동 종료 → 휴식 카운트다운 → 다음 세트 |
| **100개 챌린지** | 초기 테스트 결과에 맞춰 오늘 할 세트를 정해주는 프로그램 |

세트 모드가 운동 진행 엔진이고, 100개 챌린지는 그 위에서 "오늘의 세트"를 계산하는 스케줄러입니다.
챌린지 모드는 100개 챌린지의 초기·중간 테스트로도 재사용됩니다.

### 100개 챌린지

[hundredpushups.com](https://hundredpushups.com) 의 6주 프로그램을 따릅니다.

1. **초기 테스트**로 최대 횟수를 재고, 결과에 따라 시작 주차와 레벨(1~3)이 정해집니다
   (21개 이상이면 1·2주차를 건너뛰고 3주차부터)
2. 주 3일, 하루 5세트. 마지막 세트는 "최소 N개 이상 가능한 만큼"
3. 2 · 4 · 5주차 끝에 다시 테스트해서 다음 주차 레벨을 정하고, 기준에 못 미치면 같은 주차를 반복
4. 6주차 이후 최종 테스트에서 100개를 넘기면 완료

주차·레벨별 전체 세트를 앱에서 미리 볼 수 있고, 목표에 크게 못 미친 날은 "이 날 다시 하기"를
고를 수 있습니다. 컨디션이 안 좋은 날 테스트했다면 "레벨 다시 재기"로 현재 주차 안에서
난이도만 다시 정할 수 있습니다.

### 운동 알림

100개 챌린지 진행 중에 요일(최대 3일)과 시간을 정해두면 그 시각에 알림이 옵니다.
서버 없이 기기에 예약하는 로컬 알림이라 오프라인에서도 동작하고, 앱을 열 때마다 예약 상태를
다시 맞춰서 강제 종료 등으로 알람이 지워져도 복구됩니다.

### 기록 · 통계 · 리더보드

- **히스토리**: 달력(월/주 전환)에서 날짜를 고르면 그날의 운동을 세트 묶음 카드로 표시
  (`세트 · 3 × 10`, `100개 챌린지 · 5세트` 처럼 모드와 목표 대비 실제 횟수까지)
- **통계**: 주간 · 월간 · 연간 그래프 (푸쉬업 수 / 세트 수 / 운동 시간)
- **리더보드**: 오늘 · 이번 달 · 올해 순위, 내 순위 행 강조

### 계정

구글 · 카카오 로그인. 가입하면 `user-xxxxxxxx` 형식의 닉네임이 자동으로 만들어지고
프로필 수정에서 바꿀 수 있습니다. 앱 안에서 회원 탈퇴(계정 · 데이터 완전 삭제)가 가능합니다.

## 기술 스택

- **React Native 0.79** (TypeScript, Hermes) — 화면 네비게이션은 React Navigation 7
- **Supabase** — 인증(구글/카카오 OIDC), Postgres + RLS, 리더보드 집계 RPC, 계정 삭제 Edge Function
- **TanStack Query v5** — 서버 상태, **Jotai** — 선택 날짜 같은 로컬 상태
- **네이티브 모듈** — ARKit(Swift) / ARCore(Java) 얼굴 추적 카운터
- **notifee** — 로컬 예약 알림
- **Jest** — 순수 로직(도메인·유틸)과 훅 단위 테스트

## 프로젝트 구조

```
src/
├── domain/          # 순수 로직 (테스트로 고정)
│   ├── hundredPushups.ts   # 6주 프로그램 표 해석: 레벨 배정, 주차 진행, 테스트 규칙
│   ├── workoutSession.ts   # 세트 운동 상태기계 (idle → tracking → rest → done)
│   └── history.ts          # 하루 기록을 운동 단위로 그룹핑
├── screens/         # 화면
├── components/features/    # 화면별 컴포넌트 (home / workout / program / push-up / calendar)
├── hooks/           # usePushUpManager(네이티브 카운팅), useWorkoutSession, useSession ...
├── remote/          # Supabase 접근 (pushup, profile, program, auth, session)
├── tanstack-query/  # queryKeys / queryOptions / mutationHooks
├── services/        # workoutReminder (notifee 래퍼)
└── utils/           # 순수 유틸 (nickname, calendar, reminder, setsPreset, time ...)
```

네이티브 카운팅(`usePushUpManager`) 위에 순수 상태기계(`workoutSession`)를 얹고, 그 위에서
프로그램 스케줄러(`hundredPushups`)가 동작하는 3층 구조입니다. 규칙은 전부 순수 함수라
UI 없이 테스트로 검증됩니다.

## 로컬 실행

```bash
npm install
```

`.env` 파일 생성 (자세한 설정은 [ENV_SETUP.md](ENV_SETUP.md)):

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```

Supabase SQL Editor 에서 스키마 SQL 실행:
[ENV_SETUP.md](ENV_SETUP.md) 의 기본 테이블 → [LEADERBOARD_RPC_FUNCTIONS.sql](LEADERBOARD_RPC_FUNCTIONS.sql)
→ [APP_UPDATE_TABLE.sql](APP_UPDATE_TABLE.sql) → [WORKOUT_MODES.sql](WORKOUT_MODES.sql)

```bash
# iOS
cd ios && pod install && cd ..
npx react-native run-ios

# Android
npx react-native run-android
```

> 얼굴 추적에는 실제 기기가 필요합니다 (iPhone X 이후 / ARCore 지원 안드로이드).
> 시뮬레이터·에뮬레이터에서는 카운팅을 제외한 화면 확인만 가능합니다.

## 테스트

```bash
npx jest __tests__/domain __tests__/hooks __tests__/remote __tests__/utils
npx tsc --noEmit
npx eslint src __tests__
```

## 배포

버전을 올릴 때 함께 바꾸는 파일: `android/app/build.gradle`(versionCode, versionName),
`package.json`, `src/utils/version.ts`.
`RELEASE_NOTES_x.y.z.txt` 와 `UPDATE_APP_VERSION_x.y.z.sql`(앱 내 업데이트 알림용
`app_versions` 행)을 추가한 뒤:

```bash
cd android && ./gradlew bundleRelease
# android/app/build/outputs/bundle/release/app-release.aab
```
