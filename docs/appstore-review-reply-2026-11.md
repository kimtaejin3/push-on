# App Store 심사 답변 (1.8.0 거절 → 1.9.0 재제출) — 2026-11-27

Submission ID 9c298adf-0261-4571-8a36-a25d2f935e64. 아래 영문을 App Store Connect 의 심사 메시지에 회신하고,
같은 내용 요약을 1.9.0 버전의 "앱 심사 정보 → 메모"에도 넣는다.

---

Hello App Review team,

Thank you for the review. We have addressed all three items in version 1.9.0.

**1. Guideline 2.1 – TrueDepth / face data**

- *What information is collected using the TrueDepth API?*
  The app runs ARKit face tracking (ARFaceTrackingConfiguration) only while a push-up set is in progress. From each ARFaceAnchor it reads only the anchor's position (its 3D transform) and computes the distance between the device and the user's face. It does not use camera images or video, the face mesh/geometry, blend shapes (expressions), or any data that could identify a person.
- *For what purposes?*
  Solely to count push-ups: when the distance becomes short and then long again, one repetition is counted. The data is not used for advertising, analytics, personalization, identification, or any other purpose.
- *Use, sharing, retention, deletion, storage?*
  The position and distance values are processed in device memory for each camera frame and discarded immediately. They are never written to disk, never sent to our server or any third party, and face tracking stops when the set ends or the user leaves the screen. Only the resulting repetition count (a number) is saved to the user's workout history.
- *Shared with third parties? Where stored?*
  No. Face data is not shared with anyone (including advertising and analytics SDKs) and is not stored anywhere.
- *Where in the privacy policy, and quote:*
  Privacy policy section "얼굴 데이터(TrueDepth)의 처리" (Processing of face data (TrueDepth)), available in the app (Settings > 개인정보 처리방침) and at our privacy policy URL. Quote (Korean, with English translation):
  > "얼굴 위치와 거리 값은 카메라 프레임마다 기기 메모리에서만 처리되고 즉시 버려지며, 기기나 서버에 저장하지 않습니다." — The face position and distance values are processed only in device memory for each camera frame and discarded immediately, and are not stored on the device or on a server.
  > "얼굴 데이터는 서버로 전송하지 않으며 제3자(광고·분석 업체 포함)에게 제공하거나 공유하지 않습니다." — Face data is not transmitted to a server and is not provided to or shared with third parties, including advertising and analytics companies.

**2. Guideline 2.1 – App Tracking Transparency**

Previously the ATT request appeared after the first completed workout, which cannot be reached on iPad (no TrueDepth camera). In 1.9.0 the ATT request is shown right after the first launch, before any ad is requested, preceded by a short explanation screen. Until the user allows tracking, only non-personalized ads are requested. A screen recording from a physical device (fresh install → explanation → ATT prompt → home) is attached.

**3. Guideline 5.1.1(v) – Registration**

The app no longer requires registration. On first launch the user goes straight to the home screen and can count push-ups, view history, streaks and the leaderboard without entering any personal information (an anonymous account is created automatically, with no email or name). Signing in with Apple, Kakao or Google is optional (Settings > 로그인하고 기록 보관하기) and only links the existing history to an account so it is kept across reinstalls and devices.

Note: automatic push-up counting uses the TrueDepth camera of Face ID iPhones. On devices without it (such as iPad), the app says so on the workout screen and counts each repetition when the user taps the screen (e.g. with the nose at the bottom of each push-up), so every feature — workouts, history, streak, leaderboard, settings and purchases — can be used and reviewed on iPad. Face tracking is never started on those devices.

Thank you.

---

## 노션 공개 개인정보처리방침에 넣을 항목 (복사해서 붙이기)

### 얼굴 데이터(TrueDepth)의 처리
앱은 푸쉬업 개수를 자동으로 세기 위해 iPhone 전면 TrueDepth 카메라와 Apple ARKit 얼굴 추적을 사용합니다.

1. 사용하는 정보
- ARKit 이 알려 주는 얼굴의 위치(3차원 좌표)만 사용해 기기와 얼굴 사이의 거리를 계산합니다.
- 카메라 영상·사진, 얼굴 모양(메시), 표정 정보, 얼굴 인식(신원 확인)용 정보는 사용하지 않습니다.

2. 이용 목적
- 거리가 가까워졌다 멀어지면 푸쉬업 1개로 세는 데에만 사용합니다. 광고, 분석, 맞춤 서비스 등 다른 목적으로 사용하지 않습니다.

3. 저장·보유·삭제
- 얼굴 위치와 거리 값은 카메라 프레임마다 기기 메모리에서만 처리되고 즉시 버려지며, 기기나 서버에 저장하지 않습니다. 운동을 마치거나 화면을 나가면 얼굴 추적이 끝납니다. 저장되는 것은 결과로 센 푸쉬업 개수뿐입니다.

4. 제3자 제공·전송
- 얼굴 데이터는 서버로 전송하지 않으며 제3자(광고·분석 업체 포함)에게 제공하거나 공유하지 않습니다.

(함께 반영: 수집 항목에 "로그인하지 않으면 이메일 없이 익명 계정으로 이용", 유료 결제·광고 항목, 위탁에 RevenueCat·Google AdMob — 앱 내 `PrivacyPolicyScreen` 과 같게)
