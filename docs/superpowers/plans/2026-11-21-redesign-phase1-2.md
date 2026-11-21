# 리디자인 1·2단계 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 디자인(`pushon-redesign.pen`)의 어두운 테마·토큰·폰트·아이콘·부품으로 앱 전체를 다시 입히고, 기존 기능·규칙은 하나도 바꾸지 않는다.

**Architecture:** 먼저 `src/theme`(토큰)과 `src/components/ui`(디자인 부품) 층을 만들고, 그 위에서 화면을 하나씩 옮긴다. 화면이 새로 필요로 하는 계산(경로 칸, 결과 사실 행, 월 요약, 운동 상태 기계의 새 단계)은 `src/domain` 순수 함수로 테스트를 먼저 쓴다. 기존 로직(판정·저장·보관·축하)은 호출만 하고 다시 쓰지 않는다.

**Tech Stack:** React Native 0.79.4 (New Architecture), TypeScript, React Navigation 7, TanStack Query v5, react-native-svg, lucide-react-native, Jest.

**Spec:** `docs/superpowers/specs/2026-11-21-redesign-phase1-2-design.md` (원칙·화면별 규칙) · `docs/superpowers/specs/2026-11-21-redesign-inventory.md` (토큰 값, 화면·노트 원문)

**디자인 자료:** `.superpowers/design-handoff/redesign/png/<노드ID>.png`, `.../html/<노드ID>.html` (수치는 HTML 이 기준). 각 Task 에 볼 노드 ID 를 적었다.

## Global Constraints

- 원칙: **보이는 모습은 디자인, 기능·규칙은 지금 앱.** 통과/실패·하향·스트릭·저장·보관·축하 판정의 결과는 바뀌면 안 된다.
- 옛 규칙 표현 금지: "주 3일", "쉬는 날", "N주 연속", "이번 주 3번 중", "18칸", "6주 · 18번". 주 7일(Day 1~7)·하루 스트릭("N일 연속") 기준으로 쓴다.
- 3~6단계 기능은 그리지 않는다: 얼굴 인식 체크·끊김 화면, 코로 세기, 소리·음성, 온보딩·거치 가이드, 광고 부품·광고 제거·광고 개인정보, 보상형, 리더보드 고정 내 순위·참여자 수·상위 %·부제, 순위 숨기기, 로그인 전 사용, 공유 카드.
- 토큰은 인벤토리 1.1·1.3·1.4 의 purple 값만. `l-*`·lime 은 쓰지 않는다. 기준 프레임 393×852, 좌우 여백 24, 주 버튼 높이 56·화면당 1개, 누르는 요소 44×44 이상.
- 폰트: 숫자 Big Shoulders(800/900), 한글 Asta Sans(500/600/700/800). 아이콘: lucide.
- 의존성: 새로 넣는 것은 `lucide-react-native`, `@react-native-community/netinfo`, 화면 꺼짐 방지 라이브러리 하나, 폰트 파일뿐. `react-native-screens` 4.16.0, `react-native-google-mobile-ads` 16.0.1 은 움직이지 않는다. 설치 뒤 `package-lock.json` 에서 다른 패키지 버전이 바뀌지 않았는지 확인한다.
- DB·서버 변경 없음. 새 **읽기** 함수는 `src/remote` 에 추가 가능(기존 함수 동작은 그대로).
- 화면은 작은 기기(375×667)에서도 잘리지 않아야 한다: 넘칠 수 있는 화면은 스크롤, 고정 높이 금지.
- 검증(모두 실패·출력 없이 끝나야 함): `npx jest __tests__/domain __tests__/remote __tests__/hooks __tests__/utils`, `npx tsc --noEmit -p tsconfig.json`, `npx eslint src __tests__`. `__tests__/App.test.tsx` 는 원래 깨져 있다. 네이티브가 바뀐 Task 는 `cd ios && pod install` 과 iOS 빌드(`xcodebuild -workspace ios/pushupApp.xcworkspace -scheme pushupApp -configuration Release -destination 'generic/platform=iOS' build`), Android 컴파일(`cd android && ./gradlew :app:assembleRelease`)까지.
- main 에 직접 커밋, push 하지 않는다. 커밋 메시지는 한국어. `.superpowers/`·`.claude/` 는 커밋하지 않는다.

## Review Focus

- **작은 화면(375×667)과 큰 글자 설정**: 히어로·결과·경로 화면이 잘리거나 버튼이 화면 밖으로 밀리면 안 된다 → 각 화면 Task 의 확인 항목, Task 17 기기 확인 목록.
- **운동 중 앱이 백그라운드로 감**: 세트가 멈추고(카운트 중이면 일시정지, 카운트다운이면 준비로) 돌아오면 이어서 할 수 있어야 한다 → Task 6 테스트, Task 7 연결.
- **휴식 뒤 자동 다음 세트가 꺼져 있음**: 지금처럼 준비 화면으로 돌아와야 한다 → Task 6 테스트(기본값 false 유지), Task 7 설정 연결.
- **3주차부터 시작한 사람·완료한 사람의 경로**: 1·2주차가 "건너뜀"으로, 완료면 42칸이 모두 지난 칸으로 → Task 9 테스트.
- **결과 화면 첫 기록**: 지난 기록이 없을 때 "지난번 대비" 행이 0·NaN 이 아니라 빠져야 한다 → Task 8 테스트.

---

## File Structure

| 파일 | 책임 |
|---|---|
| `src/theme/{colors,spacing,typography,fonts,index}.ts` | 디자인 토큰, 폰트 이름 매핑 |
| `assets/fonts/*`, `react-native.config.js` | 폰트 번들 |
| `src/components/ui/*` | 디자인 부품 (Text, Button, Chip, Toggle, Row, Stepper, StreakDay, SetMeter, PathNode, TabBar …) |
| `src/components/ui/feedback/*` | Toast·BottomSheet·ConfirmDialog·Empty/Error·Skeleton·OfflineBar |
| `src/domain/workoutSession.ts` | 운동 상태 기계 — 카운트다운·일시정지·휴식 연장·자동 다음 세트 추가 |
| `src/domain/programPath.ts` | 경로 칸 계산 |
| `src/domain/resultFacts.ts` | 결과 화면 사실 행 |
| `src/domain/historySummary.ts` | 월 요약·주간 총합 |
| `src/domain/freeSetSuggestion.ts` | 자유 세트 추천 |
| `src/utils/workoutPrefs.ts` | "휴식 뒤 자동 다음 세트" 설정 저장 |
| `src/remote/pushup.ts` | 새 읽기: 직전 운동 총합, 이전 한 세트 최고, 월 범위 세트 |
| `src/screens/*`, `src/components/features/*` | 화면 리스킨 |

---

### Task 1: 토큰·폰트·아이콘

**Files:**
- Create: `src/theme/colors.ts`, `src/theme/spacing.ts`, `src/theme/typography.ts`, `src/theme/fonts.ts`, `src/theme/index.ts`, `assets/fonts/` (폰트 파일), `react-native.config.js`, `__tests__/utils/fonts.test.ts`
- Modify: `package.json`, `package-lock.json`, `ios/Podfile.lock`, iOS `Info.plist`(UIAppFonts), Android `app/src/main/assets/fonts/` (링크 도구가 만드는 변경)
- 디자인: `html/e9gxU.html`(Design System), 인벤토리 1장

**Interfaces:**
- Produces:

```ts
// src/theme/colors.ts — 인벤토리 1.1 purple 값 그대로 (광고 ad-* 포함, l-* 제외)
export const color: {
  bg: string; surface: string; surface2: string; border: string;
  text: string; textMuted: string; quiet: string; onAccent: string;
  active: string; activeFill: string; activeButton: string; onBrand: string;
  activeSoft: string; activeTint: string; activeDim: string; activeLine: string;
  rest: string; alert: string; record: string;
  tabBar: string; offlineBar: string;
  adSurface: string; adBorder: string; adBadgeBg: string; adBadgeText: string; adCtaStroke: string; adMedia: string; adBody: string; adMark: string;
};
// src/theme/spacing.ts
export const space: {4: 4; 8: 8; 12: 12; 16: 16; 20: 20; 24: 24; 32: 32; 48: 48};
export const radius: {s: 8; m: 12; l: 16; sheet: 24; dialog: 20; tabBar: 32; tabItem: 26; chip: 20; pill: 999};
export const layout: {screenPadding: 24; touchMin: 44; primaryButtonHeight: 56; frameWidth: 393};
// src/theme/typography.ts
export type TextVariant = 'display' | 'hero' | 'title' | 'headline' | 'body' | 'label' | 'caption';
export const textVariants: Record<TextVariant, {fontSize: number; weight: FontWeight; role: FontRole}>;
//   display 220/900/num · hero 96/800/num · title 28/800/ko · headline 22/700/ko · body 16/500/ko · label 14/600/ko · caption 13/500/ko
// src/theme/fonts.ts
export type FontRole = 'num' | 'ko';
export type FontWeight = 500 | 600 | 700 | 800 | 900;
export const fontFamilyFor: (role: FontRole, weight: FontWeight, os: 'ios' | 'android') => string;
```

- [ ] **Step 1: 실패하는 테스트** — `__tests__/utils/fonts.test.ts`

```ts
import {fontFamilyFor} from '../../src/theme/fonts';

describe('fontFamilyFor', () => {
  it('굵기별 파일을 Android 는 파일 이름(확장자 제외)으로 찾는다', () => {
    expect(fontFamilyFor('num', 900, 'android')).toBe('BigShoulders-Black');
    expect(fontFamilyFor('ko', 700, 'android')).toBe('AstaSans-Bold');
  });
  it('iOS 는 폰트의 PostScript 이름을 쓴다 (설치한 파일에서 확인한 값으로)', () => {
    expect(typeof fontFamilyFor('ko', 500, 'ios')).toBe('string');
    expect(fontFamilyFor('ko', 500, 'ios')).not.toBe('');
  });
  it('없는 조합은 가장 가까운 굵기로 (숫자 500 → 800)', () => {
    expect(fontFamilyFor('num', 500, 'android')).toBe('BigShoulders-ExtraBold');
  });
});
```

- [ ] **Step 2: 실패 확인** — `npx jest __tests__/utils/fonts.test.ts` → 모듈 없음
- [ ] **Step 3: 폰트 받기와 번들** — Google Fonts 공식 배포본(github.com/google/fonts, OFL)에서 Big Shoulders 800·900, Asta Sans 500·600·700·800 정적 TTF 를 받아 `assets/fonts/` 에 둔다. 파일 이름은 `BigShoulders-ExtraBold.ttf`, `BigShoulders-Black.ttf`, `AstaSans-Medium.ttf`, `AstaSans-SemiBold.ttf`, `AstaSans-Bold.ttf`, `AstaSans-ExtraBold.ttf`. `react-native.config.js` 의 `assets` 에 등록하고 `npx react-native-asset` 으로 링크. iOS PostScript 이름은 `fc-scan`/`otfinfo` 등으로 파일에서 읽어 `fonts.ts` 에 적는다. 라이선스 파일(OFL.txt)도 함께 둔다.
- [ ] **Step 4: 토큰 파일과 `fontFamilyFor` 구현**, `lucide-react-native` 설치(RN 0.79 New Architecture 지원 버전을 공식 문서로 확인). 다른 패키지 버전이 움직이지 않았는지 확인.
- [ ] **Step 5: 검증** — jest·tsc·eslint, `cd ios && pod install`, iOS 빌드, Android 컴파일.
- [ ] **Step 6: 커밋** — `feat(theme): 디자인 토큰·폰트·lucide 아이콘 추가`

---

### Task 2: 기본 디자인 부품

**Files:**
- Create: `src/components/ui/Text.tsx`, `Button.tsx`, `Chip.tsx`, `Toggle.tsx`, `Row.tsx`, `Stepper.tsx`, `SegmentedControl.tsx`, `ScreenHeader.tsx`, `Card.tsx`, `StreakDay.tsx`, `SetMeter.tsx`, `PathNode.tsx`, `Icon.tsx`, `index.ts`
- 디자인: `png/e9gxU.png`·`html/e9gxU.html`, `png/Lhcq5.png`·`html/Lhcq5.html`, 부품 목록은 인벤토리 4장

**Interfaces:**
- Consumes: Task 1 토큰·`fontFamilyFor`
- Produces (props 만 고정, 모양은 디자인 HTML 수치):

```ts
Text: ({variant?: TextVariant; color?: keyof typeof color; weight?: FontWeight; numeric?: boolean; style?; children})
Button: ({variant: 'primary' | 'secondary' | 'text'; title: string; onPress; disabled?: boolean; loading?: boolean; icon?: LucideName})
Chip: ({label: string; tone?: 'neutral' | 'active' | 'rest' | 'alert' | 'record'; selected?: boolean; onPress?})
Toggle: ({value: boolean; onChange: (v: boolean) => void; disabled?: boolean})
Row: ({title: string; subtitle?: string; value?: string; icon?: LucideName; onPress?; right?: ReactNode; destructive?: boolean})
Stepper: ({label: string; value: number; min: number; max: number; step?: number; unit?: string; onChange})
SegmentedControl: ({options: {key: string; label: string}[]; value: string; onChange})
ScreenHeader: ({title: string; onBack?: () => void; right?: ReactNode})
Card: ({tone?: 'surface' | 'brand'; children; style?})
StreakDay: ({label: string; mark: 'done' | 'frozen' | 'missed' | 'today' | 'future'})   // DayMark (src/domain/streak.ts)
SetMeter: ({total: number; current: number; results?: number[]})                       // 세트 세그먼트
PathNode: ({status: 'done' | 'today' | 'upcoming' | 'skipped' | 'locked'; label: string; size?: number})
Icon: ({name: LucideName; size?: number; color?: keyof typeof color})
```

- [ ] **Step 1: 부품 구현** — 각 부품은 디자인 HTML 의 수치(크기·간격·라운드·색·폰트)를 그대로. 누르는 부품은 최소 44×44, 주 버튼 높이 56, 눌림 상태·disabled 상태 포함.
- [ ] **Step 2: 검증** — tsc·eslint, 기존 jest.
- [ ] **Step 3: 커밋** — `feat(ui): 디자인 기본 부품 추가`

---

### Task 3: 피드백 부품 (토스트·시트·확인창·상태·오프라인)

**Files:**
- Create: `src/components/ui/feedback/ToastProvider.tsx`, `BottomSheet.tsx`, `ConfirmDialog.tsx`, `EmptyState.tsx`, `ErrorState.tsx`, `Skeleton.tsx`, `OfflineBar.tsx`, `src/hooks/useOnline.ts`, `__tests__/hooks/useOnline.test.tsx`
- Modify: `App.tsx`(ToastProvider·OfflineBar 장착), `package.json`, `package-lock.json`, `ios/Podfile.lock`
- 디자인: `png/Lhcq5.png`·`html/Lhcq5.html`, 상태 묶음 `png/ndTPN.png`(G-05 오프라인)

**Interfaces:**
- Produces:

```ts
useToast(): {show: (message: string, options?: {action?: {label: string; onPress: () => void}; tone?: 'neutral' | 'alert'}) => void}
BottomSheet: ({visible: boolean; onClose: () => void; title?: string; children})
ConfirmDialog: ({visible: boolean; title: string; message?: string; confirmLabel: string; cancelLabel?: string; destructive?: boolean; onConfirm; onCancel})
EmptyState / ErrorState: ({title: string; message?: string; actionLabel?: string; onAction?})
Skeleton: ({width: number | 'fill'; height: number; radius?: number})
useOnline(): boolean | null        // null = 아직 모름
OfflineBar: () => JSX.Element | null   // 오프라인일 때만, 화면 위쪽
```

- [ ] **Step 1: 실패하는 테스트** — `useOnline` (NetInfo 를 팩토리 목으로): 처음엔 `null`, `isConnected: false` 이벤트 뒤 `false`, `true` 이벤트 뒤 `true`, 언마운트 시 구독 해제 호출.
- [ ] **Step 2: 실패 확인** → **Step 3: 구현** — 시트·다이얼로그·토스트는 RN `Modal`·`Animated` 로 직접(외부 바텀시트 라이브러리 금지). `@react-native-community/netinfo` 설치(RN 0.79 New Architecture 지원 버전 확인).
- [ ] **Step 4: 검증** — jest·tsc·eslint, pod install, iOS 빌드, Android 컴파일.
- [ ] **Step 5: 커밋** — `feat(ui): 토스트·바텀시트·확인창·상태·오프라인 부품 추가`

---

### Task 4: 내비게이션 — 어두운 스택, 탭 4개, 스플래시·업데이트 모달

**Files:**
- Modify: `src/navigations/AppNavigation.tsx`, `src/navigations/BottomTabNavigation.tsx`, `src/components/common/UpdateModal.tsx`, `src/screens/ProgramScreen.tsx`(라우트 타입만), `src/screens/WorkoutScreen.tsx:191`, `src/screens/ProgramTableScreen.tsx:55`, `src/components/features/program/ProgramTestResult.tsx:77`, `src/screens/HomeScreen.tsx:88`
- Create: `src/components/ui/TabBar.tsx`
- 디자인: TabBar(인벤토리 4장, `html/T1WBJV.html` 의 TabBar Wrap), 스플래시·업데이트 `png/ndTPN.png`(G-01~04)

**Interfaces:**
- Produces:

```ts
export type BottomTabParamList = {
  Home: undefined;
  Program: {notice?: string} | undefined;   // 100개 챌린지 (스택에서 탭으로 이동)
  History: undefined;                        // 기록 (Task 11 에서 통계 합침)
  Setting: undefined;
};
// 프로그램으로 돌아가는 모든 곳: navigation.dispatch(StackActions.popTo('Tabs', {screen: 'Program', params: {notice}}))
```

- [ ] **Step 1: 탭 4개** (홈·100개 챌린지·기록·설정, 라벨·lucide 아이콘, 떠 있는 pill, 탭 진동 유지). 통계 탭은 빼되 `StatisticScreen` 은 스택 화면 `Statistic` 으로 남겨 Task 11 전까지 기록 화면에서 들어갈 수 있게 한다.
- [ ] **Step 2: `Program` 을 스택에서 탭으로 옮기고** 위 4곳의 이동을 `popTo('Tabs', {screen: 'Program', params})` 로. 안내 문구(notice)와 `celebrateThen` 순서는 그대로.
- [ ] **Step 3: 스택 `contentStyle` 을 `color.bg`, 상태바 밝은 글자**, 로딩·프로필 오류 화면(지금 `ConditionalNavigation`)과 업데이트 모달을 디자인대로.
- [ ] **Step 4: 검증** — jest·tsc·eslint. `grep -rn "navigate('Program'\|popTo('Program'" src` 결과 없음.
- [ ] **Step 5: 커밋** — `feat(nav): 어두운 테마 내비게이션과 탭 4개`

---

### Task 5: 홈

**Files:**
- Modify: `src/screens/HomeScreen.tsx`
- Create: `src/components/features/home/TodayHero.tsx`, `StreakRow.tsx`, `OtherWorkoutRow.tsx`
- Delete(사용처가 없어지면): `src/components/features/home/ModeCard.tsx`, `LinkRow.tsx`, `src/components/features/streak/StreakBadge.tsx`
- 디자인: `png/T1WBJV.png`·`html/T1WBJV.html`, 홈 상태 `png/ndTPN.png`, 스펙 5.1

**Interfaces:**
- Consumes: `currentProgramQueryOptions`, `resolveProgramView`, `toProgramState`, `todayPlan`, `describeSets`, `todayProgress`, `useStreak`, `streakBanner`, `useNow`, Task 2 부품
- 홈 히어로 상태 5가지(스펙 5.1): 시작 전 / 진행(디자인 그대로) / 테스트 차례 / 오늘 완료(+ "미리 하기") / 100개 달성. 로딩·오류는 Skeleton·ErrorState.

- [ ] **Step 1: 히어로** — 날짜("11월 21일 토요일" 형식), "오늘 할 운동 · 100개 챌린지 · N주차 Day D · 약 N분 · 총 N개를 S세트로", 세트 칩(마지막은 `N+`), [시작]. 예상 시간 = (세트 수 × 45초 + (세트 수 − 1) × 휴식초)/60 올림 — 작성자 판단, 화면에 "약"으로만 표시.
- [ ] **Step 2: 스트릭 줄** — "N일 연속" + `streakBanner(state, hour)` + 월~일 `StreakDay` 7칸. 누르면 `Streak` 화면. 스트릭 정보 없으면 숨김. 오른쪽 위 불꽃 배지 제거.
- [ ] **Step 3: 다른 운동** — "한 번에 몇 개?"(챌린지, 부제에 최고 기록 — 기존 데이터에서), "자유 세트"(세트 설정). 맨 아래 "순위 보기" 행 → `Leaderboard`.
- [ ] **Step 4: 검증** — jest·tsc·eslint, 375 폭에서 스크롤로 모두 보이는지(ScrollView).
- [ ] **Step 5: 커밋** — `feat(home): 홈을 새 디자인으로`

---

### Task 6: 운동 상태 기계 확장

**Files:**
- Modify: `src/domain/workoutSession.ts`, `src/hooks/useWorkoutSession.ts`
- Test: `__tests__/domain/workoutSession.test.ts`

**Interfaces:**
- Produces:

```ts
export type WorkoutPhase = 'idle' | 'countdown' | 'tracking' | 'paused' | 'rest' | 'done';
export type WorkoutState = { /* 기존 필드 */ countdownRemaining: number; autoNext: boolean };
export const COUNTDOWN_SECONDS = 3;
export const REST_EXTEND_SECONDS = 15;
export const createWorkout: (plan: WorkoutPlan, options?: {autoNext?: boolean}) => WorkoutState; // autoNext 기본 false (기존 동작)
export type WorkoutEvent = /* 기존 */
  | {type: 'beginCountdown'}   // idle → countdown(3)
  | {type: 'countdownTick'}    // 1 감소, 0 이 되면 tracking(currentCount 0)
  | {type: 'pause'}            // tracking → paused, countdown → idle
  | {type: 'resume'}           // paused → tracking
  | {type: 'extendRest'};      // rest 에서 +15초
// finishSet: tracking 또는 paused 에서 세트를 끝낸다
// restTick 이 0 에 닿거나 skipRest: autoNext 면 다음 세트 tracking(currentCount 0), 아니면 지금처럼 idle
// shouldConfirmLeave: countdown·paused 도 "시작함"으로 본다
// useWorkoutSession: countdown 중 1초 간격 countdownTick, 반환값에 beginCountdown·pause·resume·extendRest 추가
```

- [ ] **Step 1: 실패하는 테스트** — 기존 테스트는 그대로 두고 추가 (`plan = {sets: [3, 3, 5], restSeconds: 2, lastIsMax: true}`):

```ts
it('beginCountdown → 3·2·1 뒤 tracking', () => {
  const s0 = run([{type: 'beginCountdown'}]);
  expect(s0).toMatchObject({phase: 'countdown', countdownRemaining: 3});
  const s = run([{type: 'countdownTick'}, {type: 'countdownTick'}, {type: 'countdownTick'}], s0);
  expect(s).toMatchObject({phase: 'tracking', currentCount: 0, countdownRemaining: 0});
});
it('카운트다운 중 pause 는 준비(idle)로', () => {
  expect(run([{type: 'beginCountdown'}, {type: 'pause'}]).phase).toBe('idle');
});
it('tracking 에서 pause → paused, 그동안 count 는 무시, resume → tracking', () => {
  const p = run([{type: 'start'}, {type: 'count', count: 2}, {type: 'pause'}, {type: 'count', count: 3}]);
  expect(p).toMatchObject({phase: 'paused', currentCount: 2});
  expect(run([{type: 'resume'}], p).phase).toBe('tracking');
});
it('paused 에서 finishSet 은 지금 개수로 세트를 끝낸다', () => {
  const s = run([{type: 'start'}, {type: 'count', count: 2}, {type: 'pause'}, {type: 'finishSet'}]);
  expect(s).toMatchObject({phase: 'rest', results: [2]});
});
it('extendRest 는 휴식 중에만 15초 더한다', () => {
  const r = run([{type: 'start'}, {type: 'count', count: 3}]);
  expect(run([{type: 'extendRest'}], r).restRemaining).toBe(17);
  expect(run([{type: 'extendRest'}])).toEqual(createWorkout(plan));
});
it('autoNext 면 휴식이 끝나면 바로 다음 세트를 센다', () => {
  const auto = createWorkout(plan, {autoNext: true});
  const s = run([{type: 'start'}, {type: 'count', count: 3}, {type: 'restTick'}, {type: 'restTick'}], auto);
  expect(s).toMatchObject({phase: 'tracking', setIndex: 1, currentCount: 0});
  const k = run([{type: 'start'}, {type: 'count', count: 3}, {type: 'skipRest'}], auto);
  expect(k).toMatchObject({phase: 'tracking', setIndex: 1});
});
it('autoNext 가 꺼져 있으면 지금처럼 준비(idle)로', () => {
  const s = run([{type: 'start'}, {type: 'count', count: 3}, {type: 'skipRest'}]);
  expect(s).toMatchObject({phase: 'idle', setIndex: 1});
});
it('카운트다운·일시정지도 나갈 때 확인한다', () => {
  expect(shouldConfirmLeave(run([{type: 'beginCountdown'}]))).toBe(true);
  expect(shouldConfirmLeave(run([{type: 'start'}, {type: 'pause'}]))).toBe(true);
});
```

- [ ] **Step 2: 실패 확인** — `npx jest __tests__/domain/workoutSession.test.ts`
- [ ] **Step 3: 구현** (리듀서·훅). 기존 이벤트의 결과는 그대로.
- [ ] **Step 4: 통과 확인** — 위 명령 + 전체 jest·tsc·eslint
- [ ] **Step 5: 커밋** — `feat(workout): 카운트다운·일시정지·휴식 연장·자동 다음 세트 상태 추가`

---

### Task 7: 운동 화면 (자유 세트·100개 챌린지)

**Files:**
- Modify: `src/screens/WorkoutScreen.tsx`, `src/screens/ChallengeScreen.tsx`, `src/components/features/workout/RestTimer.tsx`, `WorkoutHeader.tsx`, `src/components/features/push-up/Count.tsx`, `TimerContainer.tsx`
- Create: `src/utils/workoutPrefs.ts`, `__tests__/utils/workoutPrefs.test.ts`, `src/hooks/useKeepAwakeWhile.ts`
- Delete: `src/components/features/push-up/Engagement.tsx` (사용처 없어지면)
- Modify: `package.json`, `package-lock.json`, `ios/Podfile.lock` (화면 꺼짐 방지 라이브러리)
- 디자인: `png/eRPZ5.png`·`c0vWW.png`·`dZvuf.png` + 각 `html`, 상태 `png/GmcvL.png`(준비)·`q4378P.png`(카운트)·`PWWhp.png`(휴식), 스펙 5.2

**Interfaces:**
- Consumes: Task 6 상태 기계, `usePushUpManager`(start/pause/resume/stop), `saveWorkout`, 기존 판정·기록·축하 흐름
- Produces:

```ts
// src/utils/workoutPrefs.ts
export type WorkoutPrefs = {autoNextSet: boolean};
export const DEFAULT_WORKOUT_PREFS: WorkoutPrefs; // {autoNextSet: true}
export const loadWorkoutPrefs: () => Promise<WorkoutPrefs>;   // 없거나 깨지면 기본값
export const saveWorkoutPrefs: (p: WorkoutPrefs) => Promise<void>;
// queryKeys.workoutPrefs = ['workoutPrefs'] — 설정 화면(Task 13)이 바꾸면 갱신
```

- [ ] **Step 1: 실패하는 테스트** — `workoutPrefs`: 기본값 `{autoNextSet: true}`, 깨진 JSON → 기본값, 저장·조회 왕복, 읽기 실패 → 기본값. (`__tests__/utils/reminder.test.ts` 의 AsyncStorage 목 방식)
- [ ] **Step 2: 실패 확인 → 구현 → 통과**
- [ ] **Step 3: 화면 연결**
  - 배경 = 상태: idle·countdown `color.bg`, tracking `color.activeFill`, paused·rest `color.rest`(휴식)/`color.bg`(일시정지 — 디자인 W-17 대로), 숫자 330pt Big Shoulders, SetMeter, "N개 남음"(마지막 세트 "최소 N, 가능한 만큼"), 진행 막대 "목표 N개 중 M개 · 0:38".
  - [시작] → `beginCountdown`, countdown 이 tracking 이 되는 순간 네이티브 세기 시작. 얼굴·거리·밝기 체크 항목은 그리지 않는다.
  - [잠깐 멈추기] → `pause`(네이티브 pause), 이어서 → `resume`, "이 세트 끝내기" → `finishSet`.
  - 휴식: "N초 쉬어요 · 다음 세트 N개 · 자동 시작"(자동이 꺼져 있으면 "자동 시작" 없음), [15초 더 쉬기] `extendRest`, [바로 시작] `skipRest`. 방금 세트 결과와 실패 안내(지금 `RestTimer` 의 내용)는 그대로 보여준다.
  - `createWorkout(plan, {autoNext: prefs.autoNextSet})` — 설정을 읽기 전에는 화면을 시작하지 않는다(읽기는 즉시 끝남).
  - 운동·휴식 중 화면 꺼짐 방지(`useKeepAwakeWhile(phase in countdown|tracking|paused|rest)`), 앱이 백그라운드로 가면 `pause`.
  - 응원 문구 삭제. 운동 그만두기·이탈 확인(`usePreventRemove`)은 그대로, 확인창은 Task 3 `ConfirmDialog`.
  - 목표 달성 순간·한 세트 개인 최고 순간 표시(W-15·16), 카운트가 오를 때 숫자 펄스.
- [ ] **Step 4: "한 번에 몇 개?"·100개 챌린지 테스트 화면(`src/screens/ChallengeScreen.tsx`)** — 같은 언어로: [시작] → 3·2·1(`COUNTDOWN_SECONDS`, 이 화면은 상태 기계 없이 지금 구조에 카운트다운만 더한다) → 보라 면 카운트, 세트 표시 없음(W-12·W-13, `png/q4378P.png`), 지금의 일시정지·재개·종료는 그대로, 화면 꺼짐 방지, 백그라운드면 일시정지.
- [ ] **Step 5: 검증** — jest·tsc·eslint, pod install, iOS 빌드, Android 컴파일.
- [ ] **Step 6: 커밋** — `feat(workout): 운동 화면을 새 디자인으로, 휴식 뒤 자동 다음 세트·화면 꺼짐 방지`

---

### Task 8: 결과 화면

**Files:**
- Create: `src/domain/resultFacts.ts`, `__tests__/domain/resultFacts.test.ts`, `src/components/features/result/ResultLayout.tsx`, `SetBars.tsx`, `FactRow.tsx`
- Modify: `src/remote/pushup.ts`, `__tests__/remote/pushup.test.ts`, `src/components/features/workout/WorkoutSummary.tsx`, `src/components/features/program/ProgramDaySummary.tsx`, `src/components/features/push-up/ChallengeResult.tsx`, `src/components/features/program/ProgramTestResult.tsx`
- 디자인: `png/W4UNQ.png`·`html/W4UNQ.html`, 상태 `png/TuPqm.png`(RS-01~18), 스펙 5.3

**Interfaces:**
- Produces:

```ts
// src/domain/resultFacts.ts
export type ResultFactsInput = {
  results: number[]; targets: number[] | null; lastIsMax: boolean;
  previousTotal: number | null; previousBestSet: number | null;
};
export type ResultFacts = {
  total: number; target: number | null; diffFromTarget: number | null;
  bestSetIndex: number; bestSetReps: number;
  diffFromPrevious: number | null;   // previousTotal 이 없으면 null
  lastSetExtra: number | null;       // lastIsMax 이고 targets 가 있을 때만
  isPersonalBestSet: boolean;        // previousBestSet 이 있고 그보다 클 때만
};
export const resultFacts: (input: ResultFactsInput) => ResultFacts;
// src/remote/pushup.ts — 새 읽기 (기존 함수는 그대로)
export const getPreviousWorkoutTotal: (mode: WorkoutMode, beforeIso: string) => Promise<number | null>;
  // 같은 mode 에서 beforeIso 이전 가장 최근 운동(workout_id 로 묶음, challenge 는 한 행)의 reps 합. 없으면 null
export const getBestSetBefore: (beforeIso: string) => Promise<number | null>;
  // beforeIso 이전 모든 운동 중 한 세트 최고 reps. 없으면 null
```

- [ ] **Step 1: 실패하는 테스트** — `resultFacts`

```ts
it('디자인 예시 그대로', () => {
  expect(resultFacts({results: [14, 16, 12, 12, 10], targets: [14, 16, 12, 12, 8], lastIsMax: true, previousTotal: 58, previousBestSet: 15}))
    .toEqual({total: 64, target: 62, diffFromTarget: 2, bestSetIndex: 1, bestSetReps: 16, diffFromPrevious: 6, lastSetExtra: 2, isPersonalBestSet: true});
});
it('첫 기록이면 지난번 대비와 개인 최고는 없다', () => {
  expect(resultFacts({results: [12], targets: null, lastIsMax: false, previousTotal: null, previousBestSet: null}))
    .toMatchObject({total: 12, target: null, diffFromTarget: null, diffFromPrevious: null, lastSetExtra: null, isPersonalBestSet: false});
});
it('최고 세트가 여럿이면 첫 번째, 같으면 개인 최고 아님', () => {
  expect(resultFacts({results: [10, 10], targets: [10, 10], lastIsMax: false, previousTotal: 20, previousBestSet: 10}))
    .toMatchObject({bestSetIndex: 0, isPersonalBestSet: false, diffFromPrevious: 0, lastSetExtra: null});
});
```

  그리고 `getPreviousWorkoutTotal`·`getBestSetBefore` 의 supabase 목 테스트(조회 조건 `user_id`·`mode`·`created_at < beforeIso`, 결과 없음 → null, 오류 → throw).
- [ ] **Step 2: 실패 확인 → 구현 → 통과**
- [ ] **Step 3: 화면** — 네 결과 화면을 `ResultLayout` 으로: 완료 칩, 총합과 목표 대비, 세트 막대(최고 세트 `record`, 마지막 + 세트 `activeFill`), 사실 행(지난번 대비 / 마지막 세트 / 한 세트 최고 — 값이 null 인 행은 빼고 첫 기록이면 RS "첫 기록" 상태), "다음 운동 · 내일 N주차 Day D"(프로그램), [확인] [기록에서 보기]. 기존 내용은 모두 유지: 통과/실패 판정 문구·세트별 부족, 하향 권유(낮추기 / 이 레벨로 한 번 더), 테스트 결과 해석, 0개 처리, 저장 대기·실패 다시 시도, `celebrateThen`, 목적지. 직전·최고 값은 운동이 끝난 시각(`beforeIso`) 기준으로 결과 화면에서 조회, 실패하면 행을 뺀다.
- [ ] **Step 4: 검증** — jest·tsc·eslint
- [ ] **Step 5: 커밋** — `feat(result): 결과 화면을 새 디자인으로, 지난번 대비·한 세트 최고`

---

### Task 9: 경로 칸 계산

**Files:**
- Create: `src/domain/programPath.ts`, `__tests__/domain/programPath.test.ts`

**Interfaces:**
- Consumes: `ProgramState`, `ProgramRecord` (src/domain/hundredPushups.ts), `WEEKS`, `DAYS_PER_WEEK`
- Produces:

```ts
export type PathCellStatus = 'done' | 'today' | 'upcoming' | 'skipped';
export type PathTestStatus = 'none' | 'done' | 'current' | 'upcoming' | 'skipped';
export type PathWeek = {week: number; cells: {day: number; status: PathCellStatus}[]; test: PathTestStatus};
export type ProgramPath = {passed: number; total: number; weeks: PathWeek[]};
export const PATH_TOTAL = 42;
export const programPath: (state: ProgramState, records: ProgramRecord[]) => ProgramPath;
```

규칙(스펙 5.4): 시작 주차 = `kind` 가 없거나 `'test'` 인 기록 중 가장 작은 `week`, 없으면 `state.week`. 시작 주차 이전 주의 칸과 테스트는 `skipped`. 지금 위치 = (주차−1)×7 + (Day−1), 테스트 차례면 (주차−1)×7 + 7. 그보다 앞 칸 `done`, 같은 칸 `today`(테스트 차례가 아닐 때), 뒤 칸 `upcoming`. `passed` 는 지금 위치(완료면 42, 건너뜀 포함). 테스트 주차(2·4·5·6): 지금 주차보다 앞이면 `done`, 지금 주차이고 테스트 차례면 `current`, 그 밖 `upcoming`; 테스트 없는 주차 `none`; 완료면 모두 `done`(건너뜀 제외).

- [ ] **Step 1: 실패하는 테스트**

```ts
const st = (p: Partial<ProgramState>): ProgramState => ({week: 1, day: 1, level: 1, lastTestReps: 10, testDue: false, status: 'active', ...p});
const attempt = (week: number, day: number) => ({week, day, reps: [1], completed_at: '2026-11-01T00:00:00Z', passed: true});
it('3주차부터 시작: 1·2주차는 건너뜀, 지난 칸에 포함', () => {
  const p = programPath(st({week: 3, day: 2, level: 2}), []);
  expect(p.passed).toBe(15);
  expect(p.total).toBe(42);
  expect(p.weeks[0].cells.every(c => c.status === 'skipped')).toBe(true);
  expect(p.weeks[1].test).toBe('skipped');
  expect(p.weeks[2].cells.slice(0, 3).map(c => c.status)).toEqual(['done', 'today', 'upcoming']);
  expect(p.weeks[3].test).toBe('upcoming');
});
it('테스트 차례: 그 주 7칸이 모두 지났고 테스트가 current, today 칸 없음', () => {
  const p = programPath(st({week: 2, day: 7, testDue: true}), [attempt(1, 1)]);
  expect(p.passed).toBe(14);
  expect(p.weeks[1].cells[6].status).toBe('done');
  expect(p.weeks[1].test).toBe('current');
  expect(p.weeks.flatMap(w => w.cells).some(c => c.status === 'today')).toBe(false);
});
it('완료: 42칸 모두 지났고 테스트는 모두 done', () => {
  const p = programPath(st({week: 6, day: 7, status: 'completed'}), [attempt(1, 1)]);
  expect(p.passed).toBe(42);
  expect(p.weeks.flatMap(w => w.cells).every(c => c.status === 'done')).toBe(true);
  expect(p.weeks.filter(w => w.test !== 'none').every(w => w.test === 'done')).toBe(true);
});
it('이동 표시는 시작 주차 계산에 쓰지 않는다', () => {
  const move = {kind: 'move' as const, week: 1, day: 1, reps: [], completed_at: '2026-11-02T00:00:00Z'};
  expect(programPath(st({week: 3, day: 1}), [move]).weeks[0].cells[0].status).toBe('skipped');
});
```

- [ ] **Step 2: 실패 확인 → 구현 → 통과**, 전체 jest·tsc·eslint
- [ ] **Step 3: 커밋** — `feat(program): 경로 칸 계산`

---

### Task 10: 100개 챌린지 화면 (경로·세트표·시작 전·100개 달성)

**Files:**
- Modify: `src/screens/ProgramScreen.tsx`, `src/screens/ProgramTableScreen.tsx`, `src/components/features/program/ProgramTodayCard.tsx`, `ProgramTestCard.tsx`, `ProgramDoneTodayCard.tsx`, `ProgramCompletedCard.tsx`, `cardStyles.ts`(제거 또는 토큰으로)
- Create: `src/components/features/program/ProgramPathView.tsx`, `src/components/features/program/MilestoneScreen.tsx`
- 디자인: `png/P0TkV.png`·`html/P0TkV.html`, 100개 달성 `png/X1nDu.png`·`html/X1nDu.html`·`png/WiRnH.png`, 스펙 5.4·5.3(100개 달성)

**Interfaces:**
- Consumes: Task 9 `programPath`, Task 2 `PathNode`, 기존 프로그램 화면 로직 전부(상태별 분기, notice, 하향, 레벨 다시 재기, 주차 직접 고르기, 그만두기)

- [ ] **Step 1: 경로** — 헤더 "N / 42칸 지났어요"(+ "처음 N개 → 지난 테스트 N개"), 진행 막대, 주차 줄: **4칸 + 3칸 두 줄**, 칸 56px(`PathNode`), 주차 라벨·상태 글자는 디자인 위치, 테스트 주차 끝에 앰버 깃발(`record`). 건너뜀은 흐리게.
- [ ] **Step 2: 오늘 카드를 경로 위에** — 지금 오늘 카드·테스트 카드·오늘 완료 카드의 내용 전부(지난 실패 이유, 하향 권유, notice, "미리 하기", 테스트 기준·쉬고 재기)를 디자인 부품으로. "힘들면 이렇게 골라도 돼요": [N주차 다시 하기](= 주차 직접 고르기로 현재 주차 Day 1, 확인창) [지금 다시 테스트](= 레벨 다시 재기). 하단 고정 CTA.
- [ ] **Step 3: 시작 전·로딩·오류·세트표·100개 달성** — 시작 전(테스트 결과별 첫날 미리보기 + 초기 테스트 시작), 전체 세트표(레벨 탭·Day 1~7·합·기준 범위·내 기록·[여기서부터]) 을 디자인 언어로. 100개 달성은 전체 화면(`MilestoneScreen`): 앰버 "100", 사실 3줄(처음 테스트 → 오늘, 걸린 기간, 통과 일수 `passedDayCount`, 총 개수), [다음 목표 정하기] = 지금의 "다시 시작". 공유 카드 버튼은 그리지 않는다. 운동 알림 카드는 여기서 빼고 Task 13 으로 옮긴다.
- [ ] **Step 4: 검증** — jest·tsc·eslint, 375 폭에서 경로가 잘리지 않는지.
- [ ] **Step 5: 커밋** — `feat(program): 100개 챌린지를 경로 화면으로`

---

### Task 11: 기록 (통계 합치기)

**Files:**
- Create: `src/domain/historySummary.ts`, `__tests__/domain/historySummary.test.ts`, `src/components/features/history/DotCalendar.tsx`, `WeeklyBars.tsx`, `DaySheet.tsx`, `PeriodStats.tsx`
- Modify: `src/screens/HistoryScreen.tsx`, `src/remote/pushup.ts`(+ 테스트), `src/navigations/AppNavigation.tsx`(Statistic 스택 화면 제거)
- Delete: `src/screens/StatisticScreen.tsx`, 사용처가 없어진 `Calendar`·`CalendarDay`·`HistorySummary`·`PushupStatsChart`
- 디자인: `png/trhJs.png`·`html/trhJs.html`, 상태 `png/WSGxM.png`(HI-02~10), 스펙 5.6

**Interfaces:**
- Produces:

```ts
// src/domain/historySummary.ts
export type MonthSummary = {total: number; activeDays: number; bestSet: number; avgPerSet: number; prevAvgPerSet: number | null};
export const monthSummary: (sets: PushupSetData[], prevSets: PushupSetData[]) => MonthSummary;
  // avgPerSet = total / 세트 수 (세트 없으면 0), prevAvgPerSet = 지난달 세트가 없으면 null. 소수 첫째 자리 반올림
export const monthSummaryLine: (s: MonthSummary) => string;
  // 이번 달 기록 없음: "이번 달 첫 운동을 기다리고 있어요" / 지난달 없음: "이번 달부터 기록이 쌓이고 있어요"
  // 차이 > 0: "지난달보다 세트당 평균 2.1개 늘었어요" / < 0: "…줄었어요" / 0: "지난달과 세트당 평균이 같아요"
export const weeklyTotals: (days: {date: string; totalReps: number}[], today: string, weeks?: number) => {weekStart: string; total: number}[];
  // 월요일 시작, 오늘이 속한 주가 마지막, 오래된 순, 기본 6주
// src/remote/pushup.ts
export const getSetsInRange: (startDate: string, endDate: string) => Promise<PushupSetData[]>; // workout_date 기준, 양끝 포함
```

- [ ] **Step 1: 실패하는 테스트**

```ts
const set = (date: string, reps: number) => ({id: date + reps, workout_date: date, reps, duration_seconds: 10, created_at: date + 'T10:00:00Z', mode: 'sets' as const, workout_id: null, set_index: null, target_reps: null});
it('월 요약과 문장', () => {
  const s = monthSummary([set('2026-11-02', 10), set('2026-11-02', 12), set('2026-11-05', 16)], [set('2026-10-03', 8), set('2026-10-04', 10)]);
  expect(s).toEqual({total: 38, activeDays: 2, bestSet: 16, avgPerSet: 12.7, prevAvgPerSet: 9});
  expect(monthSummaryLine(s)).toBe('지난달보다 세트당 평균 3.7개 늘었어요');
  expect(monthSummaryLine({...s, prevAvgPerSet: null})).toBe('이번 달부터 기록이 쌓이고 있어요');
  expect(monthSummaryLine(monthSummary([], []))).toBe('이번 달 첫 운동을 기다리고 있어요');
});
it('주간 총합 6주, 월요일 시작', () => {
  const w = weeklyTotals([{date: '2026-11-16', totalReps: 50}, {date: '2026-11-21', totalReps: 72}, {date: '2026-10-12', totalReps: 30}], '2026-11-21');
  expect(w.map(x => x.weekStart)).toEqual(['2026-10-12', '2026-10-19', '2026-10-26', '2026-11-02', '2026-11-09', '2026-11-16']);
  expect(w.map(x => x.total)).toEqual([30, 0, 0, 0, 0, 122]);
});
```

  그리고 `getSetsInRange` supabase 목 테스트.
- [ ] **Step 2: 실패 확인 → 구현 → 통과**
- [ ] **Step 3: 화면** — 월 이동, 요약 문장, 지표 3개(총 개수 / 운동한 날 / 한 세트 최고), 점 크기 달력(오늘 링, 그 달 최고의 날 앰버), 날짜를 누르면 `DaySheet`(그날 운동별 세트 — 지금 `WorkoutGroupCard` 내용, 저장 대기 표시 포함), 주간 총합 막대 6주(이번 주 보라, 최고 주 앰버, 지난 주 회색, SVG), 그 아래 "기간별 통계"(주/월/연 × 개수/세트/시간 — 지금 통계 화면의 데이터, 디자인 막대 스타일). 빈·첫·로딩·오류 상태(HI). 통계 탭·스택 화면 제거.
- [ ] **Step 4: 검증** — jest·tsc·eslint
- [ ] **Step 5: 커밋** — `feat(history): 기록과 통계를 한 화면으로`

---

### Task 12: 스트릭 화면·축하 모달

**Files:**
- Modify: `src/screens/StreakScreen.tsx`, `src/components/features/streak/StreakCelebrationProvider.tsx`, `WeekDots.tsx`(→ `StreakDay` 사용)
- 디자인: 없음 — 디자인 언어(Task 1·2·3 부품, 숫자 Big Shoulders, 마일스톤 `record`), 스펙 5.5

- [ ] **Step 1: 리스킨** — 내용·동작은 그대로(숫자, 이번 주 7칸, 최고 기록, 보호권 n/2와 설명, 다음 마일스톤, 알림 켜기·시각(시 0~21), 축하의 제목·줄·알림 권유 1회·`next` 정확히 한 번).
- [ ] **Step 2: 검증** — jest·tsc·eslint
- [ ] **Step 3: 커밋** — `feat(streak): 스트릭 화면과 축하 모달을 새 디자인으로`

---

### Task 13: 설정 (운동 알림 이동·자동 다음 세트 토글)

**Files:**
- Modify: `src/screens/SettingScreen.tsx`, `src/navigations/AppNavigation.tsx`(새 스택 화면)
- Create: `src/screens/WorkoutReminderScreen.tsx` (지금 `ReminderSettingsCard` 내용)
- Delete: `src/components/common/SettingItem.tsx`(사용처 없어지면), `src/components/features/program/ReminderSettingsCard.tsx`(옮긴 뒤)
- 디자인: `png/d8Ec8.png`·`html/d8Ec8.html`(광고 섹션 제외), 상태 `png/UMGhz.png`(SE-09~15), 스펙 5.8

**Interfaces:**
- Consumes: Task 7 `loadWorkoutPrefs`·`saveWorkoutPrefs`·`queryKeys.workoutPrefs`, `getCurrentAppVersion`

- [ ] **Step 1: 섹션** — 운동: "운동 알림"(→ 하위 화면, 요약 "매일 오후 8:00"/"꺼짐"), "휴식 뒤 자동으로 다음 세트"(Toggle). 계정: "계정"(→ AccountSettings), 프로필. 정보: 이용약관, 개인정보 처리방침, 문의하기, 버전(실제 버전). 광고 제거·광고와 개인정보·거치 가이드·소리·진동은 그리지 않는다.
- [ ] **Step 2: 운동 알림 하위 화면** — 지금 카드의 동작 그대로(켜기 시 권한, 7일 선택, 매일 권유 문구, 시·분), 디자인 SE-10~12.
- [ ] **Step 3: 검증** — jest·tsc·eslint
- [ ] **Step 4: 커밋** — `feat(settings): 설정을 새 디자인으로, 운동 알림을 설정으로 옮김`

---

### Task 14: 계정·프로필·문서

**Files:**
- Modify: `src/screens/AccountSettingsScreen.tsx`, `ProfileEditScreen.tsx`, `TermsOfServiceScreen.tsx`, `PrivacyPolicyScreen.tsx`
- 디자인: `png/KHwpI.png`(SE-16~30), 스펙 5.8

- [ ] **Step 1: 리스킨** — 계정: 로그인 방식·마스킹 이메일, 로그아웃, 회원 탈퇴 2단계(`ConfirmDialog` 두 번, 탈퇴 가능 여부 확인·애플 revoke 등 지금 흐름 그대로). 프로필: 닉네임 인라인 검증(지금 `utils/nickname.ts` 규칙), 이니셜 아바타. 문서: 본문 서식(SE-30).
- [ ] **Step 2: 검증** — jest·tsc·eslint
- [ ] **Step 3: 커밋** — `feat(account): 계정·프로필·문서 화면을 새 디자인으로`

---

### Task 15: 로그인·자유 세트 설정·리더보드

**Files:**
- Create: `src/domain/freeSetSuggestion.ts`, `__tests__/domain/freeSetSuggestion.test.ts`
- Modify: `src/screens/AuthScreen.tsx`, `src/screens/SetsSetupScreen.tsx`, `src/screens/LeaderboardScreen.tsx`
- 디자인: 로그인 `png/F9BKr.png`(A-01~06), 자유 세트 `png/Vg2IC.png`(SS-01~04), 리더보드 `png/M3R5u.png`·`html/M3R5u.html`(광고 제외)·상태 `png/s6I49.png`, 스펙 5.7·5.9·5.10

**Interfaces:**
- Produces:

```ts
export const suggestFreeSets: (bestReps: number | null) => {sets: number; reps: number; restSeconds: number} | null;
// null → null, reps = max(1, round(best × 0.6)), sets 3, restSeconds 60 (작성자 판단, 매일 운동 비율과 같은 0.6)
```

- [ ] **Step 1: 실패하는 테스트** — `suggestFreeSets(41)` → `{sets: 3, reps: 25, restSeconds: 60}`, `suggestFreeSets(1)` → reps 1, `suggestFreeSets(null)` → null.
- [ ] **Step 2: 실패 확인 → 구현 → 통과**
- [ ] **Step 3: 화면** — 로그인: 디자인대로(애플은 iOS 만 맨 위, 카카오·구글, 로딩·실패). 자유 세트: 프리셋 칩, Stepper, 요약, 추천(최고 기록은 지금 데이터의 챌린지 모드 최고, 없으면 추천 숨김). 리더보드: 세그먼트, 날짜·기준, 순위 행(이니셜 아바타, 1~3등 표시 유지), 내 행 강조(목록에 있을 때), 빈·오류·로딩. 고정 내 순위·참여자 수·상위 %·부제는 그리지 않는다.
- [ ] **Step 4: 검증** — jest·tsc·eslint
- [ ] **Step 5: 커밋** — `feat: 로그인·자유 세트·리더보드를 새 디자인으로`

---

### Task 16: 옛 스타일 정리

**Files:**
- Delete/Modify: `src/constants/colors.ts`, `src/components/common/{CustomButton,Header,Text,Timer,BottomTabs,CustomTextInput,DatePickerModal}.tsx` 중 사용처가 없어진 것, FontAwesome 의존성(`@react-native-vector-icons/fontawesome5`·`fontawesome6`)과 남은 사용처

- [ ] **Step 1:** `grep -rn "constants/colors\|fontawesome\|CustomButton\|common/Header" src` 로 남은 사용처를 새 부품으로 바꾸고, 사용처가 없는 파일·의존성을 지운다(의존성 제거 후 pod install).
- [ ] **Step 2: 검증** — jest·tsc·eslint, iOS 빌드, Android 컴파일. 위 grep 결과 없음.
- [ ] **Step 3: 커밋** — `chore: 옛 색·부품·아이콘 정리`

---

### Task 17: 전체 검증

- [ ] **Step 1:** Global Constraints 의 검증 명령 모두, iOS 빌드, Android 컴파일.
- [ ] **Step 2:** `grep -rn "주 3일\|쉬는 날\|주 연속\|18칸\|이번 주 .*번 중" src` 결과 없음.
- [ ] **Step 3:** 스펙 4·5장을 한 줄씩 대조.
- [ ] **Step 4: 기기 확인 목록 전달** (작은 기기 포함)
  1. 탭 4개, 모든 화면 어두운 테마, 폰트·아이콘이 디자인과 같음
  2. 홈 히어로 5가지 상태, 스트릭 줄 → 스트릭 화면, 순위 보기 → 리더보드
  3. 운동: [시작] → 3·2·1 → 보라 화면 카운트 → 휴식 시안 화면 → 자동 다음 세트(설정으로 끄면 준비 화면), 15초 더·바로 시작, 잠깐 멈추기·이어서, 화면이 꺼지지 않음, 홈 버튼 눌렀다 돌아오면 멈춰 있음
  4. 결과: 지난번 대비·한 세트 최고, 첫 기록, 실패·하향 권유·테스트 결과 문구, 축하 모달, 프로그램 탭으로 이동과 안내
  5. 100개 챌린지 경로 42칸, 3주차 시작 계정의 건너뜀 표시, 세트표·주차 바꾸기, 100개 달성 화면
  6. 기록: 달력·날짜 시트·주간 막대·기간별 통계
  7. 설정: 운동 알림 하위 화면(기존 요일 유지), 자동 다음 세트 토글, 계정 탈퇴 2단계
  8. 375×667 기기에서 잘리는 화면 없음
