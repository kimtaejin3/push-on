# App Store Connect 입력 내용 — 푸쉬온 1.6.0

각 항목의 글자 수 제한은 App Store Connect 기준. 괄호 안은 현재 글자 수.

## 앱 정보

**앱 이름** (30자 이하, 현재 16자)
```
푸쉬온 - 푸쉬업 자동 카운터
```

**부제** (30자 이하, 현재 17자)
```
폰을 바닥에 두면 횟수가 세어져요
```

**카테고리**: 기본 `건강 및 피트니스` / 보조 `스포츠`

**연령 등급**: 모든 문항 "아니요" → 4+

**저작권**: `© 2026 PushOn` (실명/사업자명으로 바꿔도 됨)

**번들 ID**: `com.pushon`  **SKU**: `pushon`

## 버전 정보

**프로모션 텍스트** (170자 이하, 현재 약 120자 — 심사 없이 언제든 수정 가능)
```
아이폰을 얼굴 앞 바닥에 놓고 푸쉬업을 하면 횟수가 자동으로 세어집니다. 챌린지 · 세트 · 100개 챌린지 중 원하는 방식으로, 기록과 리더보드까지 함께.
```

**설명** (4000자 이하, 현재 약 950자)
```
푸쉬온은 아이폰 하나로 푸쉬업 횟수를 자동으로 세어 주는 앱입니다.

기기를 얼굴과 마주 보게 바닥에 두고 "시작하기"를 누른 뒤 푸쉬업만 하세요. 전면 카메라의 얼굴 추적으로 내려갔다 올라오는 동작을 인식해 한 개씩 정확히 카운트합니다. 손으로 세거나 스마트워치를 볼 필요가 없습니다.

■ 세 가지 운동 모드
• 챌린지 — 한 세트에 몇 개까지 되는지 최대 횟수 도전
• 세트 — 세트 수와 목표 횟수를 정하면 목표 도달 시 자동 종료, 휴식 타이머까지
• 100개 챌린지 — 연속 100개를 목표로 오늘 할 세트를 정해주는 프로그램

■ 100개 챌린지
• 초기 테스트로 지금 최대 횟수를 재고, 결과에 맞춘 난이도로 시작
• 주 3일, 하루 5세트. 오늘 할 세트를 앱이 정해줍니다
• 중간 테스트로 난이도를 다시 맞추고, 힘들었던 날은 다시 도전할 수 있어요
• 운동하는 날 원하는 시간에 알림

■ 자동 카운트
• 얼굴과 기기 사이의 거리를 측정해 푸쉬업 한 개를 정확히 인식
• 개수가 올라갈 때마다 진동 피드백
• 일시정지 / 재개, 세트별 소요 시간 기록

■ 기록과 통계
• 달력을 월 · 주 단위로 보며 날짜별 운동을 세트 묶음으로 확인
• 주간 · 월간 · 연간 그래프로 꾸준함을 확인

■ 리더보드
• 오늘 · 이번 달 · 올해 순위
• 내 순위를 한눈에 확인하며 다른 사용자와 경쟁

■ 간편한 시작
• 구글 또는 카카오 계정으로 바로 로그인
• 닉네임은 자동으로 만들어지고 언제든 변경 가능
• 앱 안에서 계정 삭제 가능

푸쉬온은 전면 카메라의 얼굴 추적 기능(TrueDepth)을 사용합니다. iPhone X 이후 모델에서 사용할 수 있으며, 카메라 영상은 기기 안에서만 처리되고 서버로 전송되지 않습니다.

매일 한 세트라도, 푸쉬온과 함께 꾸준히.
```

**키워드** (100자 이하, 쉼표 구분, 현재 76자 — 앱 이름에 이미 있는 "푸쉬온/푸쉬업/카운터"는 넣지 않음)
```
팔굽혀펴기,푸시업,운동,홈트,홈트레이닝,맨몸운동,근력,운동기록,챌린지,피트니스,랭킹,상체,가슴운동,헬스,workout,pushup
```

**이 버전의 새로운 기능** (첫 출시이므로 간단히)
```
푸쉬온 첫 출시!
• 아이폰을 바닥에 두면 푸쉬업 횟수를 자동으로 세어 드려요
• 챌린지 · 세트 · 100개 챌린지, 세 가지 운동 모드
• 달력 기록, 주간·월간 통계, 리더보드
```

**지원 URL**: `https://github.com/kimtaejin3/push-on` (또는 문의 페이지)
**마케팅 URL** (선택): 비워도 됨
**개인정보 처리방침 URL** (필수): 앱 내 PrivacyPolicyScreen 내용을 공개 페이지(GitHub Pages 등)에 올린 뒤 주소 입력 — **아직 없음, 준비 필요**

## App Privacy (개인정보 설문)

수집 항목 — 모두 "사용자 신원과 연결됨", 용도 "앱 기능":
- 연락처 정보 > 이메일 주소 (구글/카카오 로그인)
- 연락처 정보 > 이름 (프로필 표시명)
- 식별자 > 사용자 ID (Supabase 계정)
- 건강 및 피트니스 > 피트니스 (푸쉬업 기록)
- 사용 데이터 > 제품 상호작용 (세트 기록 시간)

추적(Tracking): 아니요. 카메라 영상은 기기 내 처리, 저장/전송 안 함.

## 심사 정보 (App Review Information)

**로그인 필요**: 예 — 소셜 로그인만 제공하므로 심사용 구글 계정을 하나 만들어 아이디/비밀번호를 적어 주세요.

**메모** (영문 권장):
```
PushOn counts push-ups automatically using ARKit face tracking on the front (TrueDepth) camera.
To test: place the iPhone on the floor facing your face, tap "시작하기" (Start), and do push-ups.
Face tracking requires a physical iPhone X or later; it does not work on the Simulator.
Demo video: https://github.com/kimtaejin3/push-on#데모
Account deletion: 설정(Settings) > 계정 설정(Account) > 회원 탈퇴(Delete account).
Sign in with Google or Kakao only (Sign in with Apple: see note in submission).
```

## 스크린샷

`screenshots/6.9/01.png ~ 05.png` (1320×2868, iPhone 6.9") — 홈(운동 모드) / 챌린지 카운팅 /
100개 챌린지 / 히스토리 / 통계. 6.9" 만 올리면 6.5"/6.1" 는 자동 적용됨.
원본 캡처는 `screenshots/raw/`, 합성 스크립트는 `screenshots/build.py` (실행: `python3 store/appstore/screenshots/build.py`).

## 제출 전 프로젝트 체크리스트

- [x] Apple Developer Program 멤버십 (개인, 팀 ID `K88WFRU2SJ`, 2027-09-23 갱신)
- [x] 번들 ID 를 `com.pushon` 으로 통일 (이전엔 시뮬레이터만 RN 템플릿 기본값이라 카카오 로그인이 실패했다)
- [x] `MARKETING_VERSION` 1.7.1 / `CURRENT_PROJECT_VERSION` 1 로 맞추기
- [x] `Info.plist` 의 빈 `NSLocationWhenInUseUsageDescription` 제거, 카메라 사용 문구를 심사용으로 구체화
- [ ] **Sign in with Apple 추가** (가이드라인 4.8 — 소셜 로그인만 제공하면 리젝) ← 가장 큰 남은 작업
- [ ] 개인정보 처리방침 공개 URL 준비 (앱 내 PrivacyPolicyScreen 내용을 GitHub Pages 등에 게시)
- [ ] Xcode 에서 Apple Distribution 인증서 발급 + 자동 서명 활성화
- [ ] App Store Connect 에 앱 등록 (이름 "푸쉬온", 번들 ID `com.pushon`, SKU `pushon`)
- [ ] ARKit 얼굴 추적 필수이므로 `UIRequiredDeviceCapabilities` 에 `arkit` 추가 검토 (미지원 기기에 노출 안 되게)
