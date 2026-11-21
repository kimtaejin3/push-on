# 리디자인 5단계 — 광고 배치·동의 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 홈·결과·기록·리더보드에 화면당 광고 1개, 결과 뒤 하루 1회 전면, 첫 결과 뒤 ATT·UMP 동의 흐름을 넣는다. 서버 설정이 꺼져 있으면 지금과 똑같이 동작한다.

**Architecture:** 노출 규칙은 `src/domain/adFrequency.ts`(순수 함수), 동의·SDK 초기화는 `src/utils/adsConsent.ts`·`adsSdk.ts`, 전면 로드·표시는 `src/hooks/useAds.ts`, 결과 화면 출구는 새 `AdExitFlowProvider` 가 `celebrateThen` 뒤에서 동의 → "저장 중" → 전면 → 목적지 → 토스트를 순서대로 돈다. 광고 자리는 `NativeAdCard`·`AdBanner`(인라인) 두 부품으로 그린다.

**Tech Stack:** React Native 0.79.4 New Architecture, TypeScript, react-native-google-mobile-ads 16.0.1(고정), react-native-permissions 5.x(ATT), TanStack Query v5, AsyncStorage, Jest.

**Spec:** `docs/superpowers/specs/2026-11-21-redesign-phase5-ads-design.md` (실행자는 이 문서와 함께 읽는다)

## Global Constraints

- `react-native-google-mobile-ads` 는 `16.0.1` 고정. 올리지 않는다(16.0.2+ 는 RN 0.79 codegen 이 깨진다).
- 서버 설정 `adsEnabled` 가 false 이면: SDK 초기화 없음, 동의 흐름 없음, 광고 자리·스켈레톤 없음, "저장 중" 화면 없음, 설정의 광고 섹션 없음. 결과 출구는 지금처럼 축하 → 목적지만(토스트는 띄운다 — Task 6 참고).
- 동의 흐름(`adsConsent`)이 끝나기 전에는 `mobileAds().initialize()` 도, 어떤 광고 요청도 하지 않는다.
- `__DEV__` 에서는 항상 `TestIds`(BANNER·INTERSTITIAL·NATIVE 또는 NATIVE_VIDEO).
- 광고 실패·지연은 이동을 막지 않는다. 출구 흐름 전체는 어떤 오류에도 결국 `go()` 를 부른다.
- 광고 표시 규칙: '광고' 배지 15px 이상(좌상단), AdChoices 우상단 24px 자리 비움, CTA 는 중립 외곽선(보라 금지), 면은 `color.adSurface` + 1px `color.adBorder`, 버튼·탭바와 붙이지 않는다.
- 문구는 스펙 그대로: 사전 안내 제목 "광고를 덜 귀찮게\n보여 드리려고 물어볼게요", 본문 "다음 창에서 허용하면 관심 있을 만한 광고가 나와요. 운동 기록은 광고에 쓰지 않아요. 허용하지 않아도 앱은 똑같이 써요.", 버튼 "계속"(닫기 없음). 토스트 "N개 저장했어요 · 기록에서 볼 수 있어요" + 액션 "보기". 설정 안내 "운동 기록·카메라 영상·건강 데이터는 광고에 쓰지 않아요. 운동 중에는 광고가 나오지 않아요."
- 화면 좌우 여백은 `layout.screenPadding`(16). 색·간격·글자는 `src/theme` 토큰과 `src/components/ui/*` 만 쓴다.
- 커밋은 `main` 에 직접, 한국어 conventional 메시지(`feat(ads): …`). 푸시하지 않는다. `.superpowers/`·`.claude/` 는 커밋하지 않는다.
- 검증 명령: `npx jest __tests__/domain __tests__/remote __tests__/hooks __tests__/utils`, `npx tsc --noEmit -p tsconfig.json`, `npx eslint src __tests__`. `__tests__/App.test.tsx` 는 원래 깨져 있다(무시).

## 광고 단위 ID

| 상수 | Android | iOS |
|---|---|---|
| `NATIVE_HOME_AD_UNIT_ID` | `ca-app-pub-5759779417992194/1263975507` | `ca-app-pub-5759779417992194/5997427432` |
| `NATIVE_RESULT_AD_UNIT_ID` | `ca-app-pub-5759779417992194/3698567152` | `ca-app-pub-5759779417992194/5902505772` |
| `NATIVE_LEADERBOARD_AD_UNIT_ID` | `ca-app-pub-5759779417992194/1678908479` | `ca-app-pub-5759779417992194/9689260432` |

기존 `BANNER_AD_UNIT_ID`·`INTERSTITIAL_AD_UNIT_ID` 값은 그대로 둔다.

## Review Focus

1. **동의 전 광고 요청** — 업데이트로 들어온 기존 사용자가 홈을 열었을 때, 서버 광고가 켜져 있어도 동의 흐름을 아직 안 돌았으면 네이티브 카드가 스켈레톤조차 그리지 않아야 한다. → Task 2 `adsConsent` 테스트 + Task 4 `useAds` 테스트(`consentDone=false` 이면 `adsEnabled=false`, `initialize` 미호출).
2. **출구를 두 번 누름** — [확인] 연타·[확인] 뒤 [기록에서 보기]로 흐름이 두 번 돌면 전면이 두 번, 이동이 두 번 일어난다. → Task 6 `useResultExit` 테스트(진행 중이면 두 번째 호출 무시).
3. **전면이 끝내 닫힘 이벤트를 안 줌 / 로드 3초 넘김** — 사용자가 결과 화면에 갇힌다. → Task 4 테스트(로드 미완이면 1초 안에 넘어감, 열린 뒤 닫힘 없음이면 90초 상한).
4. **같은 날 테스트 뒤 다른 운동** — "한 번에 몇 개?"를 한 날 저녁 자유 세트를 해도 전면이 없어야 한다. 자정(KST)이 지나면 다시 대상. → Task 1 테스트.
5. **광고 꺼짐 상태 회귀** — 서버 설정이 꺼져 있으면 결과 출구가 지금과 같은 시간에 목적지로 가야 한다("저장 중" 0.5초 대기도 없음). → Task 6 테스트.

---

### Task 1: 노출 규칙 — 테스트한 날 면제, 새 기본값

**Files:**
- Modify: `src/domain/adFrequency.ts`, `src/utils/adState.ts`, `APP_CONFIG.sql`
- Test: `__tests__/domain/adFrequency.test.ts`, `__tests__/utils/adState.test.ts`(있으면 수정, 없으면 생성)

**Interfaces:**
- Produces:
  - `AdState` 에 `testDate: string | null` 추가 (KST `YYYY-MM-DD`, `formatKSTDate`).
  - `recordTestDay(state: AdState, now: Date): AdState` — `testDate` 를 오늘(KST)로.
  - `shouldShowInterstitial(config, state, now)` 는 `state.testDate === formatKSTDate(now)` 이면 false.
  - `ADS_OFF` 기본값: `dailyCap: 1, minGapSeconds: 43200, graceWorkouts: 3`.
- 100개 달성은 최종 테스트로만 일어나므로 "테스트한 날" 면제가 "100개 달성일" 면제를 포함한다. 따로 기록하지 않는다. (계획 작성자 판단)

- [ ] **Step 1: 실패하는 테스트 추가** (`adFrequency.test.ts`)
  - `it('오늘 테스트를 했으면 노출하지 않는다')`: `{...base, testDate: '2026-10-19'}` → false.
  - `it('어제 테스트한 기록은 면제하지 않는다')`: `testDate: '2026-10-18'` → true.
  - `it('recordTestDay 는 KST 날짜를 적는다')`: `recordTestDay(base, new Date('2026-10-19T23:30:00+09:00')).testDate === '2026-10-19'`, 그리고 `new Date('2026-10-19T15:30:00Z')`(KST 20일 00:30) → `'2026-10-20'`.
  - `it('rollDate 는 testDate 를 유지한다')`.
  - `it('ADS_OFF 기본값은 하루 1회·12시간·첫 3회')`: `expect(ADS_OFF).toMatchObject({dailyCap: 1, minGapSeconds: 43200, graceWorkouts: 3})`.
  - 기존 테스트의 `base` 에 `testDate: null` 추가. 유예 테스트는 `graceWorkouts` 를 명시한 config 로 고쳐 기존 의미를 유지(`{...on, graceWorkouts: 1}`).
  - `adState.test.ts`: `testDate` 가 없는 옛 저장값(`{date, shownToday, lastShownAt, completedWorkouts}`)을 읽으면 `testDate: null` 로 채워 돌려준다.
- [ ] **Step 2: 실패 확인** — `npx jest __tests__/domain/adFrequency.test.ts __tests__/utils/adState.test.ts` → 새 테스트 FAIL.
- [ ] **Step 3: 구현** — `createAdState` 는 `testDate: null`. `loadAdState` 는 `testDate` 가 문자열이 아니면 null 로 채운다. `APP_CONFIG.sql` 기본값을 `interstitial_daily_cap 1`, `interstitial_min_gap_seconds 43200`, `interstitial_grace_workouts 3` 으로 바꾸고, 이미 테이블이 있는 경우를 위해 끝에 `ALTER TABLE app_config ALTER COLUMN … SET DEFAULT …` 3줄과 `UPDATE app_config SET interstitial_daily_cap = 1, interstitial_min_gap_seconds = 43200, interstitial_grace_workouts = 3 WHERE id = 'default';` 를 더한다.
- [ ] **Step 4: 통과 확인** — 같은 명령 PASS, `npx tsc --noEmit -p tsconfig.json` 통과.
- [ ] **Step 5: 커밋** — `feat(ads): 테스트한 날 전면 면제, 노출 기본값 하루 1회·12시간·첫 3회`

### Task 2: 동의 흐름(ATT·UMP)과 맞춤 광고 규칙, 광고 단위 상수

**Files:**
- Create: `src/utils/adsConsent.ts`
- Modify: `src/utils/adsSdk.ts`, `src/constants/ads.ts`, `package.json`, `ios/Podfile`, `ios/pushupApp/Info.plist`, `jest.setup.js`(또는 기존 jest mock 위치)
- Test: `__tests__/utils/adsConsent.test.ts`, `__tests__/utils/adsSdk.test.ts`(있으면 수정)

**Interfaces:**
- Produces (`src/utils/adsConsent.ts`):
  - `type TrackingStatus = 'unavailable' | 'not-determined' | 'denied' | 'authorized' | 'restricted'`
  - `getTrackingStatus(): Promise<TrackingStatus>` — iOS 만 `react-native-permissions` 의 `check(PERMISSIONS.IOS.APP_TRACKING_TRANSPARENCY)`; Android 는 `'unavailable'`. 실패하면 `'unavailable'`.
  - `isConsentFlowDone(): boolean` (메모리 값, 앱 시작 때 `loadConsentFlowDone()` 으로 채움)
  - `loadConsentFlowDone(): Promise<boolean>` — AsyncStorage 키 `ads-consent-flow-done` === `'1'`.
  - `subscribeConsentFlowDone(listener: (done: boolean) => void): () => void`
  - `runConsentFlow(showPrePrompt: () => Promise<void>): Promise<void>` — 절대 throw 하지 않는다. 순서: iOS 이고 상태가 `not-determined` 이면 `await showPrePrompt()` → `request(PERMISSIONS.IOS.APP_TRACKING_TRANSPARENCY)`. 그다음 `AdsConsent.gatherConsent()`(실패는 경고만). 마지막에 키 저장 + 메모리 true + 구독자 알림. 이미 끝났으면 아무것도 하지 않는다. 동시에 두 번 불리면 같은 프라미스.
  - `canShowPrivacyOptions(): Promise<boolean>` — `AdsConsent.getConsentInfo()` 의 `privacyOptionsRequirementStatus === AdsConsentPrivacyOptionsRequirementStatus.REQUIRED`.
  - `showPrivacyOptions(): Promise<void>` — `AdsConsent.showPrivacyOptionsForm()`.
  - `resetAdsConsentForTest(): void`
- Produces (`src/utils/adsSdk.ts`): `initializeAdsSdk()` 는 `isConsentFlowDone()` 이 false 면 **메모하지 않고** false 를 돌려준다(동의 뒤 다시 부를 수 있게). `gatherConsent` 호출은 여기서 뺀다(동의 흐름으로 이동). `getConsentInfo().canRequestAds` 확인·`setRequestConfiguration`·`initialize` 는 그대로.
- Produces (`src/constants/ads.ts`):
  - `NATIVE_HOME_AD_UNIT_ID`, `NATIVE_RESULT_AD_UNIT_ID`, `NATIVE_LEADERBOARD_AD_UNIT_ID: string` — 위 표의 값, `__DEV__` 는 `TestIds.NATIVE_VIDEO`(16.0.1 에 없으면 `TestIds.NATIVE`).
  - `adRequestOptions(): Promise<RequestOptions>` — iOS: `{requestNonPersonalizedAdsOnly: (await getTrackingStatus()) !== 'authorized'}`; 그 밖: `{}`(UMP·TCF 결과를 SDK 가 따른다). `AD_REQUEST_OPTIONS` 상수는 지운다(쓰는 곳은 Task 3·4 가 바꾼다).
- 라이브러리: `react-native-permissions` 5.x 최신. 설치 전 README 로 RN 0.79·New Architecture 지원과 iOS 설정법(`ios/Podfile` 의 `setup_permissions(['AppTrackingTransparency'])`)을 확인하고 그대로 따른다. Android 쪽 설정은 필요 없다(ATT 만 씀).
- `Info.plist`: `NSUserTrackingUsageDescription` = "관심 있을 만한 광고를 보여 드리는 데 쓰여요. 운동 기록은 광고에 쓰지 않아요."

- [ ] **Step 1: 실패하는 테스트** (`adsConsent.test.ts`, `react-native-permissions`·`AdsConsent`·AsyncStorage 를 mock, `Platform.OS` 를 ios/android 로 바꿔 가며)
  - `it('iOS 에서 아직 안 물어봤으면 사전 안내 → ATT 요청 → UMP 순서로 돈다')` — 호출 순서 `['prePrompt', 'request', 'gatherConsent']`.
  - `it('iOS 에서 이미 정했으면 사전 안내 없이 UMP 만')` — `check` 가 `'denied'` → prePrompt·request 미호출.
  - `it('Android 는 사전 안내·ATT 없이 UMP 만')`.
  - `it('gatherConsent 가 실패해도 흐름을 끝내고 완료로 남긴다')` — 이후 `isConsentFlowDone() === true`, AsyncStorage 에 `'1'`.
  - `it('이미 끝났으면 다시 돌지 않는다')`, `it('동시에 두 번 불러도 사전 안내는 한 번')`.
  - `it('완료되면 구독자에게 알린다')`.
  - `adsSdk.test.ts`: `it('동의 흐름 전에는 초기화하지 않고, 끝난 뒤 부르면 초기화한다')` — 첫 호출 false·`initialize` 미호출, `runConsentFlow` 뒤 두 번째 호출 true.
  - `it('adRequestOptions: iOS 허용이면 맞춤, 거부면 비맞춤, Android 는 빈 옵션')`.
- [ ] **Step 2: 실패 확인** — `npx jest __tests__/utils` → 새 테스트 FAIL.
- [ ] **Step 3: 구현** — 위 인터페이스대로. `react-native-permissions` 설치(`npm install react-native-permissions@^5`), Podfile·Info.plist 설정, jest 에 `react-native-permissions/mock` 연결(라이브러리 문서의 jest 안내대로). `cd ios && pod install`.
- [ ] **Step 4: 통과 확인** — `npx jest __tests__/utils` PASS, `npx tsc --noEmit -p tsconfig.json` 은 `AD_REQUEST_OPTIONS` 를 쓰던 `useAds.ts`·`AdBanner.tsx` 에서만 실패할 수 있다 → 두 곳을 `await adRequestOptions()` 로 최소 수정해 통과시킨다(본격 변경은 Task 3·4).
- [ ] **Step 5: 커밋** — `feat(ads): 첫 결과 뒤 ATT·UMP 동의 흐름, 동의 전 SDK 초기화 막기, 네이티브 광고 단위`

### Task 3: 광고 부품 — 네이티브 카드, 인라인 배너

**Files:**
- Create: `src/components/ads/NativeAdCard.tsx`, `src/components/ads/AdBadge.tsx`, `src/components/ads/AdSkeleton.tsx`
- Move/Modify: `src/components/common/AdBanner.tsx` → `src/components/ads/InlineAdBanner.tsx`(옛 파일 삭제, 쓰는 곳 없음)
- 디자인: `.superpowers/design-handoff/redesign/png/miaaz.png`, `html/miaaz.html`(수치), `png/rnkiX.png`(AD-15 실패 시 간격)

**Interfaces:**
- Consumes: `useAds().adsEnabled`(서버 켜짐 && SDK 준비 — Task 4 이후 동의 완료 포함), `adRequestOptions()`, `NATIVE_*_AD_UNIT_ID`, `BANNER_AD_UNIT_ID` (Task 2).
- Produces:
  - `NativeAdCard({unitId, style}: {unitId: string; style?: StyleProp<ViewStyle>})` — `adsEnabled` 가 false 면 `null`. 켜져 있으면 로드 전 `AdSkeleton`(높이 358), 로드되면 디자인 `Ad/Native Medium`: 좌상단 `AdBadge`, 아이콘 + 광고주 이름(headline) + 본문 2줄 말줄임, `NativeMediaView` 16:9, 중립 외곽선 CTA(callToAction, 없으면 숨김). 실패하면 `null`(자리를 접는다). 언마운트 때 `nativeAd.destroy()`.
    - 요청: `NativeAd.createForAdRequest(unitId, {...await adRequestOptions(), startVideoMuted: true, aspectRatio: NativeMediaAspectRatio.LANDSCAPE, adChoicesPlacement: NativeAdChoicesPlacement.TOP_RIGHT})`. 16.0.1 의 실제 export 이름은 `node_modules/react-native-google-mobile-ads/lib/typescript` 에서 확인한다.
    - 클릭 영역은 제목·아이콘·미디어·CTA 만(`NativeAsset` 으로 감싼 것만). 카드 패딩·빈 곳은 감싸지 않는다.
  - `InlineAdBanner({style})` — 높이 110 고정 컨테이너(`color.adSurface`, 1px `color.adBorder`, `radius` 토큰), 좌상단 `AdBadge`, `BannerAdSize.INLINE_ADAPTIVE_BANNER` + `maxHeight={110}`(16.0.1 prop 확인). 로드 전 같은 높이 스켈레톤, 실패하면 `null`.
  - `AdBadge()` — "광고" 15px, `color.adBadgeBg`/`color.adBadgeText`.
- [ ] **Step 1: 구현** — 위대로. UI 부품이라 단위 테스트는 두지 않는다(네이티브 모듈 mock 비용 대비 가치 낮음). 대신 `npx tsc`·`npx eslint` 로 확인.
- [ ] **Step 2: 확인** — `npx tsc --noEmit -p tsconfig.json`, `npx eslint src` 통과.
- [ ] **Step 3: 커밋** — `feat(ads): 네이티브 광고 카드·인라인 배너·스켈레톤 부품`

### Task 4: `useAds` — 동의 완료 반영, 전면 미리 불러오기, 지난 검토 고침

**Files:**
- Modify: `src/hooks/useAds.ts`
- Test: `__tests__/hooks/useAds.test.ts`(있으면 수정)

**Interfaces:**
- Consumes: Task 1 `recordTestDay`, Task 2 `isConsentFlowDone`·`subscribeConsentFlowDone`·`loadConsentFlowDone`·`adRequestOptions`·`initializeAdsSdk`.
- Produces:
  - `useAds()` 반환: `{adsEnabled: boolean, serverAdsEnabled: boolean, consentDone: boolean, showInterstitial: () => Promise<void>, recordWorkout: () => Promise<void>, recordTestDay: () => Promise<void>, prepareInterstitial: () => void}`
    - `adsEnabled` = `serverAdsEnabled && consentDone && sdkReady`. 초기화 effect 는 `serverAdsEnabled && consentDone` 일 때만 돈다(동의 완료 알림을 구독해 다시 돈다).
  - 모듈 함수(훅 밖에서도 쓰도록 export): `prepareInterstitial(config: AdConfig | undefined): void` — SDK 준비·규칙 통과일 때만 로드를 시작해 두고(이미 진행/준비 중이면 무시), `waitInterstitialReady(timeoutMs: number): Promise<boolean>` — 준비되면 true, 시간 넘기면 false, `showPreparedInterstitial(getConfig: () => AdConfig | undefined): Promise<void>` — 보여주기 **직전에** `getConfig()` 로 최신 설정을 다시 `shouldShowInterstitial` 로 확인, 통과할 때만 `show()`, 열리면 노출 기록, 닫힘·오류·90초 상한까지 기다린다.
  - 잠금: 진행 중 전면 프라미스는 닫힘·오류·전체 상한(90초)으로 끝날 때까지 유지(“열림” 신호가 5초보다 늦어도 풀리지 않게). `INTERSTITIAL_OPEN_TIMEOUT_MS` 로 끝내지 않는다.
  - 기존 `showInterstitial()` 은 `prepare → waitReady(3000) → showPrepared` 로 다시 만든다(호환).
- [ ] **Step 1: 실패하는 테스트** (`InterstitialAd` mock — 이벤트를 수동으로 쏘는 가짜)
  - `it('동의 흐름 전에는 서버가 켜도 adsEnabled 가 false 이고 초기화하지 않는다')`.
  - `it('준비가 1초 안에 안 되면 waitInterstitialReady(1000) 은 false')` (jest fake timers).
  - `it('보여주기 직전에 서버가 광고를 끄면 show 를 부르지 않는다')`.
  - `it('열림 신호가 6초 뒤에 와도 닫힐 때까지 다음 호출은 같은 프라미스를 기다린다')`.
  - `it('열린 뒤 닫힘이 없으면 90초 뒤 끝난다')`.
  - `it('recordTestDay 는 저장된 상태에 오늘 날짜를 남긴다')`.
- [ ] **Step 2: 실패 확인** — `npx jest __tests__/hooks/useAds.test.ts` FAIL.
- [ ] **Step 3: 구현** — 위대로. 로드는 `InterstitialAd.createForAdRequest(INTERSTITIAL_AD_UNIT_ID, await adRequestOptions())`, 로드 실패·타임아웃이면 준비 안 됨(면제 "로드 실패").
- [ ] **Step 4: 통과 확인** — `npx jest __tests__/hooks __tests__/utils __tests__/domain` PASS, tsc 통과.
- [ ] **Step 5: 커밋** — `feat(ads): 동의 뒤에만 광고, 전면 미리 불러오기, 표시 직전 설정 재확인·잠금 유지`

### Task 5: 광고 자리 — 홈·결과·기록·리더보드

**Files:**
- Modify: `src/screens/HomeScreen.tsx`, `src/components/features/result/ResultLayout.tsx`, `src/screens/HistoryScreen.tsx`, `src/screens/LeaderboardScreen.tsx`
- 디자인: `png/BVAkZ.png`(홈), `png/hzROn.png`(결과), `png/KrjtX.png`(기록), `png/M3R5u.png`(리더보드), `png/K1pFwS.png`(배치 지도)

**Interfaces:**
- Consumes: Task 3 `NativeAdCard`, `InlineAdBanner`; Task 2 `NATIVE_*_AD_UNIT_ID`; Task 4 `useAds().prepareInterstitial`.
- 배치:
  - 홈: '다른 운동' 영역 바로 아래 `NativeAdCard unitId={NATIVE_HOME_AD_UNIT_ID}`. 아래 여백은 `useTabBarInset()` 기준으로 탭바와 40 이상.
  - 결과(`ResultLayout`): `children`(다음 운동 등) 다음, 경고·버튼 영역 위에 `NativeAdCard unitId={NATIVE_RESULT_AD_UNIT_ID}`. 버튼과 44 이상 띄운다(카드 아래 `marginBottom: 44` 또는 버튼 영역 위 간격). 결과 화면에 들어오면 `prepareInterstitial()` 을 한 번 부른다(테스트 모드 `challenge`·`program_test` 는 부르지 않는다 — 그날은 면제).
  - 기록: 달력과 주간 총합 사이, 위아래 28, `InlineAdBanner`.
  - 리더보드: 10위 행 다음에 `NativeAdCard unitId={NATIVE_LEADERBOARD_AD_UNIT_ID}`, 그 뒤 11위부터. 10명 이하이면 목록 끝에 붙이지 않는다(광고 없음).
- 광고 꺼짐이면 부품이 `null` 이라 레이아웃이 지금과 같아야 한다 — 부품 주위 간격은 부품 안(또는 부품이 그려질 때만 생기는 래퍼)에 둔다.
- [ ] **Step 1: 구현** — 위대로.
- [ ] **Step 2: 확인** — `npx tsc --noEmit -p tsconfig.json`, `npx eslint src`, `npx jest __tests__/domain __tests__/remote __tests__/hooks __tests__/utils` 통과.
- [ ] **Step 3: 커밋** — `feat(ads): 홈·결과·리더보드 네이티브, 기록 인라인 배너 자리`

### Task 6: 결과 출구 흐름 — 동의 → 저장 중 → 전면 → 목적지 → 토스트

**Files:**
- Create: `src/components/features/ads/AdExitFlowProvider.tsx`(Provider + `useResultExit`), `src/components/features/ads/SavingOverlay.tsx`, `src/components/features/ads/TrackingPrePrompt.tsx`, `src/navigation/navigationRef.ts`
- Modify: `App.tsx`(Provider 를 `StreakCelebrationProvider` 안, `AppNavigation` 바깥에), `src/navigation/AppNavigation.tsx`(`NavigationContainer ref={navigationRef}`), `src/screens/WorkoutScreen.tsx:349-360`, `src/components/features/push-up/ChallengeResult.tsx:30`, `src/components/features/program/ProgramTestResult.tsx:85`
- Test: `__tests__/hooks/useResultExit.test.tsx`
- 디자인: `png/puDBa.png`(저장 중), `png/HWhD8.png`(AD-12)

**Interfaces:**
- Consumes: `useStreakCelebration().celebrateThen`, `useToast().show(message, {action})`, Task 2 `runConsentFlow`·`isConsentFlowDone`, Task 4 `useAds()`·`prepareInterstitial`·`waitInterstitialReady`·`showPreparedInterstitial`.
- Produces:
  ```ts
  export type ResultExit = {
    reps: number;            // 저장한 개수 (토스트·저장 중 문구)
    detail?: string;         // 저장 중 부제 뒤쪽, 예: '3주차 Day 2'
    queued?: boolean;        // 폰에 보관만 됨 → "오늘 기록 저장 대기"
    test?: boolean;          // 최대 개수 측정(한 번에 몇 개?·100개 챌린지 테스트) → 그날 전면 면제
    destination: 'Home' | 'Program' | 'History';
    go: () => void;          // 지금의 이동 그대로
  };
  export function useResultExit(): (exit: ResultExit) => void;
  export const navigationRef; // createNavigationContainerRef()
  ```
- 흐름(`exit` 한 번):
  1. 진행 중이면 무시(연타·두 번째 출구).
  2. `celebrateThen(run)`.
  3. `run`: `recordWorkout()`, `test` 면 `recordTestDay()`.
  4. 서버 광고 꺼짐 → `go()` → 토스트 → 끝(대기 없음).
  5. 동의 안 끝남 → `runConsentFlow(showPrePrompt)`(iOS 사전 안내는 `TrackingPrePrompt` 전체 화면 Modal, [계속] 만, 뒤로가기로 닫히지 않음).
  6. `prepareInterstitial(config)` → `SavingOverlay` 표시: 제목 "오늘 기록 저장 중"(`queued` 면 "오늘 기록 저장 대기"), 부제 `${reps}개` + (`detail` 있으면 ` · ${detail}`). 최소 500ms, 준비가 진행 중이면 최대 1000ms 까지 `waitInterstitialReady`.
  7. 오버레이를 내리고 준비됐으면 `showPreparedInterstitial(() => 최신 config)` 를 기다린다.
  8. `go()`, 그다음 `destination !== 'History'` 이면 `toast.show('${reps}개 저장했어요 · 기록에서 볼 수 있어요', {action: {label: '보기', onPress: () => navigationRef.dispatch(StackActions.popTo('Tabs', {screen: 'History'}))}})`.
  9. 3~8 의 어떤 오류도 잡아 `go()` 를 반드시 한 번 부른다.
- 호출부 교체(이동 규칙·0개·저장 실패 처리는 그대로, `celebrateThen(...)` 호출만 바꾼다):
  - `WorkoutScreen.leaveSummary`: `didAny` 이면 `exit({reps: 총합, detail: 프로그램 Day 면 '${week}주차 Day ${day}' 아니면 undefined, queued: 세트 저장 상태가 'queued', destination: to ?? (프로그램이면 'Program' 아니면 'Home'), go})`. 총합·위치·저장 상태는 파일 안 기존 값에서 가져온다.
  - `ChallengeResult`: 저장 성공 콜백에서 `exit({reps: pushUpCount, test: true, destination: destination.current, go: goNext})`.
  - `ProgramTestResult.finish`: `exit({reps, test: true, destination: to, go: () => goTo(to)})`.
- [ ] **Step 1: 실패하는 테스트** (`useResultExit.test.tsx`, `celebrateThen` 은 바로 `next()` 를 부르는 가짜, `useAds`·`adsConsent`·toast 를 mock, fake timers)
  - `it('광고 꺼짐이면 기다리지 않고 바로 이동하고 토스트를 띄운다')` — `go` 가 타이머 진행 없이 호출, 저장 중 오버레이 없음.
  - `it('첫 결과면 동의 흐름 → 저장 중 → 이동 순서')`.
  - `it('저장 중은 최소 500ms, 준비가 안 되면 1000ms 에 넘어간다')`.
  - `it('준비됐으면 전면을 보여 주고 닫힌 뒤 이동한다')`.
  - `it('목적지가 기록이면 토스트를 띄우지 않는다')`.
  - `it('test 면 그날 테스트로 기록한다')`.
  - `it('진행 중에 다시 부르면 무시한다')`.
  - `it('전면 오류가 나도 이동한다')`.
- [ ] **Step 2: 실패 확인** — `npx jest __tests__/hooks/useResultExit.test.tsx` FAIL.
- [ ] **Step 3: 구현** — 위대로. 오버레이·사전 안내는 `ToastProvider` 처럼 루트 위에 그린다(사전 안내는 `Modal`, 저장 중은 `pointerEvents="auto"` 전체 화면 View, 배경 `color.bg`, 스피너 원 + 제목 `title` 변형 + 부제 `textMuted`).
- [ ] **Step 4: 통과 확인** — `npx jest __tests__/domain __tests__/remote __tests__/hooks __tests__/utils` PASS, tsc·eslint 통과.
- [ ] **Step 5: 커밋** — `feat(ads): 결과 출구에 동의·저장 중·전면·저장 토스트 흐름`

### Task 7: 설정 "광고와 개인정보" 섹션

**Files:**
- Modify: `src/screens/SettingScreen.tsx`
- Create: `src/components/features/ads/AdReportSheet.tsx`
- 디자인: 설정 시안(SE-08·SE-14) — `png/` 에서 설정 화면 시안을 찾아 따른다(없으면 기존 `Section`·`Row` 모양)

**Interfaces:**
- Consumes: `useAds().serverAdsEnabled`, Task 2 `getTrackingStatus`·`canShowPrivacyOptions`·`showPrivacyOptions`, `BottomSheet`.
- 섹션 제목 "광고와 개인정보", '정보' 섹션 앞. `serverAdsEnabled` 가 false 면 섹션 전체를 그리지 않는다.
  - "맞춤 광고 동의 변경" — `canShowPrivacyOptions()` 가 true 일 때만. 누르면 `showPrivacyOptions()`.
  - (iOS) "앱 추적 허용" — 값 "허용"/"허용 안 함"/"아직 안 물어봄"/"제한됨". 누르면: 아직 안 물어봄이면 Task 6 의 사전 안내 → ATT 요청(`runConsentFlow` 가 아니라 ATT 만 — `adsConsent` 에 `requestTracking(showPrePrompt)` 를 더해 쓴다), 그 밖이면 `Linking.openSettings()`. 앱이 앞으로 돌아오면 상태를 다시 읽는다.
  - "광고 신고하기" — `AdReportSheet`: "광고 오른쪽 위 ⓘ 를 누르면 Google 에 바로 신고할 수 있어요. 문제가 계속되면 문의하기로 알려 주세요." + [닫기].
  - 섹션 아래 안내 문구(Global Constraints 의 문구), `caption`·`textMuted`.
- [ ] **Step 1: 구현** — 위대로.
- [ ] **Step 2: 확인** — tsc·eslint·jest 통과.
- [ ] **Step 3: 커밋** — `feat(ads): 설정에 광고와 개인정보 섹션`

### Task 8: 빌드·기기 확인·설치

- [ ] **Step 1:** `npx jest __tests__/domain __tests__/remote __tests__/hooks __tests__/utils`, `npx tsc --noEmit -p tsconfig.json`, `npx eslint src __tests__` 전부 통과.
- [ ] **Step 2:** `cd android && ./gradlew assembleDebug` 성공.
- [ ] **Step 3:** iOS Release 빌드·설치(메모리 `ios-device-install` 명령). 서버 설정은 꺼져 있으므로 기기에서는 광고가 보이지 않아야 하고, 결과 출구가 지금처럼 바로 이동하며 저장 토스트가 뜬다.
- [ ] **Step 4:** (사용자 확인 뒤) 개발 빌드에서 테스트 광고로 홈·결과·기록·리더보드 자리, 동의 흐름, 전면을 확인한다 — `APP_CONFIG.sql` 실행 전이라 로컬에서 `adConfigQueryOptions` 를 임시로 켜서 본다(커밋하지 않는다).
