# 광고(AdMob) 도입 설계

날짜: 2026-10-09 · 상태: 검토 중

## 1. 배경과 목표

홍보로 사용자 유입이 늘어나는 시점에 맞춰 AdMob 광고를 넣는다. 목표는 수익화이되,
**리텐션을 해치지 않는 것이 1순위 제약**이다. 현재 신규 가입자 6명 중 5명이 첫 운동도
하지 않고 이탈하는 상태이므로, 광고가 그 숫자를 더 나쁘게 만들면 안 된다.

따라서 설계의 중심은 "어디에 넣는가"보다 **"언제 넣지 않는가"와 "어떻게 즉시 끄는가"** 다.

### 성공 기준
- 운동 흐름(카운팅·휴식·테스트)에 광고가 전혀 끼어들지 않는다
- 광고를 켜고 끄는 데 앱 업데이트가 필요 없다
- 첫 운동 경험에는 전면광고가 노출되지 않는다
- iOS 첫 심사에 ATT 팝업이라는 변수를 추가하지 않는다

### 범위 밖
리워드 광고, 광고 제거 인앱결제, ATT(앱 추적 투명성) 도입, 네이티브 광고.
ATT 는 트래픽이 붙고 비개인화 광고 수익이 확인된 뒤 별도 작업으로 다룬다.

## 2. 광고 배치

| 위치 | 형식 | 비고 |
|---|---|---|
| 홈 | 배너 | 탭바 위 하단 고정 |
| 히스토리 | 배너 | 탭바 위 하단 고정 |
| 통계 | 배너 | 탭바 위 하단 고정 |
| 운동 완료 → "홈으로/프로그램으로" | 전면광고 | 세트·100개 챌린지 |
| 챌린지 결과 → "기록하고 홈으로" | 전면광고 | 챌린지 모드 |

### 광고를 넣지 않는 구간 (변경 불가 원칙)
- 운동 중 카운팅 화면 (`WorkoutScreen` tracking, `ChallengeScreen` tracking)
- 세트 사이 휴식 타이머
- 100개 챌린지 초기·중간·최종 테스트
- 로그인·온보딩 경로, 프로필 수정, 설정

전면광고는 **결과 화면을 먼저 보여준 뒤 화면을 떠날 때** 띄운다. 성취 순간을 광고로
덮지 않기 위해서다.

## 3. 빈도 제한

| 규칙 | 기본값 |
|---|---|
| 전면광고 일일 최대 | 2회 |
| 직전 노출 후 최소 간격 | 180초 |
| 전면광고 유예 (누적 완료 운동 수) | 1회 — 즉 **첫 운동에는 노출 안 함** |

하루 경계는 KST 기준(`formatKSTDate` 재사용). 누적 완료 운동 수는 날짜가 바뀌어도
초기화하지 않는다.

**"완료한 운동"의 정의**: 세트·프로그램 모드는 마지막 세트까지 끝나 요약 화면에
도달한 경우, 챌린지 모드는 1회 이상 기록된 경우. 중간에 그만둔 운동은 세지 않는다.

**호출 순서**: 운동이 끝나면 먼저 `recordWorkoutCompleted` 로 카운트를 올리고,
그다음 화면을 떠날 때 `shouldShowInterstitial` 을 판정한다. 따라서 판정 시점의
`completedWorkouts` 에는 **방금 끝낸 운동이 포함**된다.

## 4. 원격 제어

광고 동작을 서버에서 끌 수 있어야 한다. Supabase 에 단일 행 설정 테이블을 둔다.

```sql
CREATE TABLE IF NOT EXISTS app_config (
  id                           text PRIMARY KEY DEFAULT 'default',
  ads_enabled                  boolean NOT NULL DEFAULT false,
  interstitial_enabled         boolean NOT NULL DEFAULT false,
  interstitial_daily_cap       int     NOT NULL DEFAULT 2,
  interstitial_min_gap_seconds int     NOT NULL DEFAULT 180,
  interstitial_grace_workouts  int     NOT NULL DEFAULT 1,
  updated_at                   timestamptz DEFAULT now()
);

ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone can read app config" ON app_config FOR SELECT USING (true);

INSERT INTO app_config (id) VALUES ('default') ON CONFLICT (id) DO NOTHING;
```

- **기본값이 전부 꺼짐**이다. 빌드를 먼저 배포하고, 준비가 되면 서버에서 켠다.
- 조회 실패(오프라인 등)하면 **광고를 띄우지 않는다** (fail-closed).
- `app_versions` 와 같은 패턴이라 기존 구조에 자연스럽게 붙는다.

## 5. 기술 구조

```
constants/ads.ts        광고 단위 ID (개발 중에는 TestIds)
domain/adFrequency.ts   순수 함수: 노출 가능 여부 판정, 상태 갱신
utils/adState.ts        AsyncStorage 저장/복원 (날짜 경계 처리 포함)
remote/appConfig.ts     app_config 조회
tanstack-query/queryOptions/appConfig.ts
hooks/useAds.ts         위를 묶어 화면에 { showInterstitial, adsEnabled } 제공
components/common/AdBanner.tsx   설정이 꺼져 있으면 아무것도 렌더하지 않음
```

### 판정 로직 (순수 함수, 테스트 대상)

```ts
export type AdConfig = {
  adsEnabled: boolean;
  interstitialEnabled: boolean;
  dailyCap: number;
  minGapSeconds: number;
  graceWorkouts: number;
};

export type AdState = {
  date: string;            // KST YYYY-MM-DD
  shownToday: number;
  lastShownAt: number | null;  // epoch ms
  completedWorkouts: number;   // 누적, 날짜 무관
};

shouldShowInterstitial(config: AdConfig, state: AdState, now: Date): boolean
recordInterstitialShown(state: AdState, now: Date): AdState
recordWorkoutCompleted(state: AdState): AdState
rollDate(state: AdState, now: Date): AdState   // 날짜가 바뀌면 shownToday 초기화
```

판정 조건(전부 만족해야 노출):
1. `config.adsEnabled && config.interstitialEnabled`
2. `state.completedWorkouts > config.graceWorkouts`
   (방금 끝낸 운동이 포함된 값이므로, `graceWorkouts = 1` 이면 첫 운동은 `1 > 1` 이
   거짓이 되어 노출되지 않고 두 번째 운동부터 노출된다)
3. `state.shownToday < config.dailyCap`
4. `lastShownAt === null || now - lastShownAt >= minGapSeconds * 1000`

### 화면 연결
- `WorkoutSummary` 의 `onDone`, `ChallengeResult` 의 홈 이동 직전에
  `await showInterstitial()` → 그다음 `navigation.navigate(...)`
- 광고 로드 실패·미노출이어도 **네비게이션은 반드시 진행**한다 (광고가 흐름을 막지 않는다)
- 운동 완료 시 `recordWorkoutCompleted` 를 호출해 유예 카운트를 올린다

### 동의 (UMP)
EEA 사용자를 위해 `react-native-google-mobile-ads` 의 UMP 를 앱 시작 시 1회 요청한다.
한국 사용자에게는 동의 폼이 표시되지 않는다. 동의 상태가 확정되기 전에는 광고를
요청하지 않는다.

### iOS: ATT 없이 비개인화로 시작
`requestNonPersonalizedAdsOnly: true` 로 시작한다. ATT 팝업을 띄우지 않으므로
`NSUserTrackingUsageDescription` 과 ATT 흐름이 필요 없고, 첫 App Store 심사에서
변수가 늘지 않는다. SKAdNetwork 식별자는 Info.plist 에 추가한다(광고 어트리뷰션용,
권한 팝업과 무관).

## 6. 네이티브 설정

- **iOS** `Info.plist`: `GADApplicationIdentifier`(AdMob 앱 ID), `SKAdNetworkItems`
- **Android** `AndroidManifest.xml`: `com.google.android.gms.ads.APPLICATION_ID` meta-data
- 광고 단위 ID 는 비밀이 아니지만 플랫폼별로 다르므로 `constants/ads.ts` 에서
  `Platform.select` 로 분기하고, `__DEV__` 에서는 항상 Google 테스트 ID 를 쓴다

## 7. 에러 처리

| 상황 | 동작 |
|---|---|
| `app_config` 조회 실패 | 광고 비노출 (fail-closed), 앱은 정상 동작 |
| 전면광고 로드 실패/타임아웃 | 즉시 네비게이션 진행, 카운터 증가시키지 않음 |
| 배너 로드 실패 | 영역을 차지하지 않고 숨김 |
| UMP 동의 실패 | 광고 비노출, 앱은 정상 동작 |

## 8. 테스트

- `domain/adFrequency`: 4개 판정 조건 각각의 경계, 날짜 롤오버, 유예 기간
- `utils/adState`: 저장/복원, 깨진 값 복구, 날짜 경계
- `remote/appConfig`: 조회 실패 시 광고 꺼진 기본값 반환
- 화면 연결은 tsc/eslint + 실기기 확인 (광고 SDK 는 단위 테스트 대상 아님)

## 9. 배포 순서

1. 이 변경을 포함해 **안드로이드 1.7.2** 배포 (이때 `ads_enabled = false`)
2. 실기기에서 테스트 광고 동작 확인
3. Play 데이터 안전 신고 갱신 → 서버에서 `ads_enabled = true`
4. 지표(첫 운동 전환율, 재방문) 관찰 → 나빠지면 즉시 `false`
5. iOS 는 애플 로그인 심사와 함께 제출, App Store 개인정보 신고 갱신

## 10. 사용자가 직접 해야 하는 일

- AdMob 계정 생성, 앱 2개(iOS/Android) 등록, **앱 ID + 배너/전면 광고 단위 ID** 발급
- `app_config` 테이블 SQL 실행
- Play 데이터 안전 / App Store 개인정보 신고에 광고 데이터 수집 항목 추가
- AdMob 에 스토어 링크 연결(수익 지급 설정 포함)
