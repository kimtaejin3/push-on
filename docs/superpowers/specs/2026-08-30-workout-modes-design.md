# 운동 모드 3종 (챌린지 / 세트 / 100개 챌린지) 설계

날짜: 2026-08-30 · 상태: 구현됨 (feat/workout-modes)

## 1. 목표

메인 화면을 3개의 모드 카드로 바꾸고, 하나의 카운팅 엔진(ARKit 얼굴 추적) 위에 세 가지 운동 방식을 얹는다.

| 모드 | 정의 | 비고 |
|---|---|---|
| 챌린지 | 한 세트 최대 횟수 도전 (현재 기능) | 리더보드·통계와 그대로 연결 |
| 세트 | N세트 × 목표 M개, 세트 사이 휴식 R초 | 기본값 + 프리셋 + 커스텀 |
| 100개 챌린지 | hundredpushups.com 6주 프로그램. 오늘 할 세트를 앱이 정해줌 | 무료. 표 그대로 사용 |

디자인 원칙: Material 느낌, 최대한 심플. 카드에 아이콘·장식 문구 없음. 텍스트와 여백만.

## 2. 아키텍처

```
usePushUpManager (네이티브 카운팅)  ← 변경 없음
        │
useWorkoutSession (순수 상태기계: idle → tracking → rest → … → done)
        │
WorkoutScreen (세트/프로그램 공용 화면)
        ├─ SetsSetupScreen → WorkoutScreen(mode='sets')
        └─ ProgramScreen  → WorkoutScreen(mode='program')  /  ChallengeScreen(purpose='test')
```

- **세트 모드가 엔진, 100개 모드는 그 위의 스케줄러.** 100개 모드는 "오늘의 세트 배열 + 휴식초"를 만들어 `WorkoutScreen` 에 넘기고, 완료 결과로 진행 상태를 갱신한다.
- 챌린지 모드는 100개 모드의 초기/재테스트로 재사용한다 (`purpose: 'program-test'` 파라미터).
- 프로그램 규칙은 네이티브·UI와 무관한 순수 모듈(`src/domain/hundredPushups.ts`)에 두고 단위 테스트한다.

## 3. 데이터 모델 (Supabase SQL — 사용자가 SQL Editor 에서 실행)

```sql
-- 기존 세트 테이블 확장 (구버전 앱 호환: 전부 기본값/nullable)
ALTER TABLE pushup_sets
  ADD COLUMN IF NOT EXISTS mode        text NOT NULL DEFAULT 'challenge', -- challenge | sets | program | program_test
  ADD COLUMN IF NOT EXISTS workout_id  uuid,      -- 한 번의 세트/프로그램 운동을 묶는 id (앱에서 생성)
  ADD COLUMN IF NOT EXISTS set_index   int,       -- 운동 내 세트 순번 (1부터)
  ADD COLUMN IF NOT EXISTS target_reps int;       -- 목표 횟수 (max 세트는 최소치)

-- 100개 프로그램 진행 상태 (유저당 active 는 최대 1개)
CREATE TABLE IF NOT EXISTS pushup_programs (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status         text NOT NULL DEFAULT 'active',   -- active | completed | abandoned
  week           int  NOT NULL DEFAULT 1,           -- 1..6
  day            int  NOT NULL DEFAULT 1,           -- 1..3
  level          int  NOT NULL,                     -- 1..3 (현재 주차의 열)
  last_test_reps int  NOT NULL,                     -- 가장 최근 테스트 결과
  test_due       boolean NOT NULL DEFAULT false,    -- 다음 행동이 테스트인지
  completed_days jsonb NOT NULL DEFAULT '[]',       -- [{week, day, reps:[...], completed_at}]
  created_at     timestamptz DEFAULT now(),
  updated_at     timestamptz DEFAULT now()
);
ALTER TABLE pushup_programs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own programs" ON pushup_programs
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS pushup_programs_user_active
  ON pushup_programs (user_id) WHERE status = 'active';
```

- 통계·리더보드·달력은 `reps` 만 보므로 영향 없음. 히스토리 세트 카드는 `target_reps` 가 있으면 "12 / 10" 처럼 표시.
- 세트는 **완료 즉시 한 건씩 저장**한다 (중간에 앱을 꺼도 한 세트는 남음).

## 4. 100개 프로그램 규칙 (hundredpushups.com 원본 그대로)

- 초기 테스트 → 열 배정: `≤5 → 1`, `6–10 → 2`, `11–20 → 3`, `>20 → 3주차에서 시작` (3주차 열 기준으로 배정).
- 주 3일(Day 1–3), 하루 5세트(5·6주차 Day 2–3 은 8–9세트). 마지막 세트는 "N+" = 최소 N개, 가능한 만큼.
- 휴식(초): 1주 60/60/60 · 2주 60/90/120 · 3주 60/90/120 · 4주 60/90/120 · 5주 60/45/45 · 6주 60/45/45.
- 테스트(최대 횟수): 2주차 끝 → 3주차 열 `16–20 / 21–25 / >25` (16 미만이면 2주차 반복). 4주차 끝 → 5주차 열 `31–35 / 36–40 / >40` (31 미만이면 4주차 반복). 5주차 끝 → 6주차 열 `46–50 / 51–60 / >60` (46 미만이면 5주차 반복). 6주차 끝 → 최종 테스트, 100개 이상이면 완료.
- 4주차는 3주차와 같은 열을 쓴다.
- 휴식일은 강제하지 않는다. 화면에 "하루 쉬고 다음 운동을 권장" 한 줄만.

세트 표는 `src/constants/hundredPushups.ts` 에 `PROGRAM[week][day] = {rest, sets: [col1[], col2[], col3[]]}` 로 그대로 옮긴다. (부록 A)

## 5. 화면

### 홈 (HomeScreen) — 3카드
- 상단: 로고 + "PushOn" (유지).
- 카드 3개 세로 배치. 각 카드: 제목(18, 600) · 설명 한 줄(14, secondary) · 상태 한 줄(100개 카드만: "시작 전" / "3주차 · Day 2" / "테스트 차례" / "완료").
- 표면색 `overlayLight`, 반경 16, 패딩 20, 아이콘 없음, 글로우 없음. Android 는 ripple.
- 기존 "내 순위 보기" 카드는 제거 (리더보드 탭이 있음).

### 챌린지 (ChallengeScreen) — 기존 유지
- 저장 시 `mode='challenge'`. `purpose='program-test'` 로 들어오면 결과 화면 버튼이 "프로그램으로 돌아가기" 가 되고 `mode='program_test'` 로 저장한 뒤 `Program` 화면에 `testReps` 를 돌려준다.

### 세트 설정 (SetsSetupScreen)
- 프리셋 칩: `3 × 10`, `5 × 15`, `5 × 20`, `커스텀`. 휴식 기본 60초.
- 커스텀: 세트 수 1–10, 목표 5–100(5 단위), 휴식 30–180초(15 단위) — 스테퍼.
- 마지막 선택은 AsyncStorage 에 기억. "시작" → WorkoutScreen.

### 운동 (WorkoutScreen) — 세트/프로그램 공용
- 헤더: "세트 2 / 5" · 목표 "10" 또는 "5+ (최소 5)".
- 본문: 기존 `Count`, `TimerContainer`, `Engagement` 재사용.
- 흐름: `idle`(시작하기) → `tracking` → 목표 도달 시 자동 종료(진동) / max 세트는 "세트 종료" 버튼 → 세트 저장 → `rest`(카운트다운, "건너뛰기") → 다음 `idle` … → `done`.
- 세트 중 "세트 종료"로 조기 종료 가능(실제 횟수로 저장). "운동 그만두기"는 확인 후 홈.
- `done`: 세트별 실제/목표 표, 총 횟수·시간. 프로그램이면 여기서 진행 상태 갱신 후 "다음: 테스트" 안내가 있을 수 있음.

### 100개 챌린지 (ProgramScreen)
- 상태별 화면: `없음`(설명 3줄 + "초기 테스트 시작") / `테스트 차례`("최대 횟수 테스트") / `진행 중`("3주차 · Day 2", 오늘 세트 "6 · 6 · 4 · 4 · 5+", 휴식 60초, "오늘 운동 시작") / `완료`("100개 달성", "다시 시작").
- 하단에 작은 "그만두기"(확인 후 `abandoned`).

### 네비게이션
`AppStack` 에 `SetsSetup`, `Workout`(params), `Program` 추가. `Challenge` 는 `purpose?` 파라미터를 받는다.

## 6. 상태기계 (useWorkoutSession)

입력: `{sets: number[], restSeconds, lastIsMax}`. 상태: `{phase: 'idle'|'tracking'|'rest'|'done', setIndex, results: number[]}`.
이벤트: `start`, `count(n)`(목표 도달 시 자동 `finishSet`), `finishSet`, `skipRest`, `restTick`, `abort`.
순수 리듀서로 작성해 단위 테스트. 네이티브 호출(`usePushUpManager`)은 화면에서 phase 변화에 맞춰 호출.

## 7. 테스트

- `domain/hundredPushups`: 열 배정(각 경계값), 주차 진행/반복 규칙, 테스트 차례 판정, 오늘의 세트 계산.
- `useWorkoutSession` 리듀서: 자동 종료, max 세트는 자동 종료 안 함, 휴식 건너뛰기, 마지막 세트 후 done.
- `remote/pushup.saveWorkoutSet`: mode/workout_id/set_index/target_reps 가 insert 에 포함되는지.
- 화면은 tsc/eslint + 실기기 확인.

## 8. 범위 밖 (이번에 안 함)

리마인더 알림, 유료화, 감도 설정, Apple Watch, 세트 모드 히스토리 그룹 표시(운동 단위 묶기).

## 부록 A. 프로그램 표 (주차/일차 → [열1, 열2, 열3], 마지막 세트는 최소치)

```
W1 rest 60/60/60
 D1 [2,3,2,2,3] [6,6,4,4,5] [10,12,7,7,9]
 D2 [3,4,2,3,4] [6,8,6,6,7] [10,12,8,8,12]
 D3 [4,5,4,4,5] [8,10,7,7,10] [11,15,9,9,13]
W2 rest 60/90/120
 D1 [4,6,4,4,6] [9,11,8,8,11] [14,14,10,10,15]
 D2 [5,6,4,4,7] [10,12,9,9,13] [14,16,12,12,17]
 D3 [5,7,5,5,8] [12,13,10,10,15] [16,17,14,14,20]
W3 rest 60/90/120   (열: 16–20 / 21–25 / >25)
 D1 [10,12,7,7,9] [12,17,13,13,17] [14,18,14,14,20]
 D2 [10,12,8,8,12] [14,19,14,14,19] [20,25,15,15,25]
 D3 [11,13,9,9,13] [16,21,15,15,21] [22,30,20,20,28]
W4 rest 60/90/120   (열: 3주차와 동일)
 D1 [12,14,11,10,16] [18,22,16,16,25] [21,25,21,21,32]
 D2 [14,16,12,12,18] [20,25,20,20,28] [25,29,25,25,36]
 D3 [16,18,13,13,20] [23,28,23,23,33] [29,33,29,29,40]
W5 rest 60/45/45    (열: 31–35 / 36–40 / >40)
 D1 [17,19,15,15,20] [28,35,25,22,35] [36,40,30,24,40]
 D2 [10,10,13,13,10,10,9,25] [18,18,20,20,14,14,16,40] [19,19,22,22,18,18,22,45]
 D3 [13,13,15,15,12,12,10,30] [18,18,20,20,17,17,20,45] [20,20,24,24,20,20,22,50]
W6 rest 60/45/45    (열: 46–50 / 51–60 / >60)
 D1 [25,30,20,15,40] [40,50,25,25,50] [45,55,35,30,55]
 D2 [14,14,15,15,14,14,10,10,44] [20,20,23,23,20,20,18,18,53] [22,22,30,30,24,24,18,18,58]
 D3 [13,13,17,17,16,16,14,14,50] [22,22,30,30,25,25,18,18,55] [26,26,33,33,26,26,22,22,60]
```
