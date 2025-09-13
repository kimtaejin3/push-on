# PushupApp - ARKit 기반 푸쉬업 카운터

PushupApp은 iOS의 ARKit 프레임워크를 활용하여 사용자의 푸쉬업 동작을 감지하고 자동으로 카운트하는 React Native 애플리케이션입니다. 얼굴 추적 기술을 사용하여 사용자가 푸쉬업을 할 때 카메라와 얼굴 사이의 거리 변화를 측정하여 정확한 푸쉬업 횟수를 계산합니다.

## 기술 스택

- **React Native**: 크로스 플랫폼 모바일 애플리케이션 개발 프레임워크
- **Swift & Objective-C**: iOS 네이티브 모듈 개발 언어
- **ARKit**: Apple의 증강 현실 프레임워크
- **SceneKit**: 3D 그래픽 렌더링 프레임워크

## ARKit 기술 설명

### ARFaceTracking

이 앱은 ARKit의 얼굴 추적(Face Tracking) 기능을 활용합니다. ARFaceTrackingConfiguration을 사용하여 사용자의 얼굴을 실시간으로 감지하고 추적합니다. 이 기술은 다음과 같은 특징을 가집니다:

- TrueDepth 카메라를 사용하여 얼굴의 3D 위치와 방향을 정확하게 추적
- 얼굴과 카메라 사이의 거리를 계산하여 푸쉬업 동작 감지
- 실시간 처리로 즉각적인 피드백 제공

### 푸쉬업 감지 알고리즘

푸쉬업 감지는 다음과 같은 알고리즘으로 구현되어 있습니다:

1. 카메라와 얼굴 사이의 거리를 지속적으로 측정
2. 거리가 설정된 임계값(closeThreshold) 이하로 내려가면 "내려가는 동작" 감지
3. 이후 거리가 다른 임계값(farThreshold) 이상으로 올라가면 한 번의 푸쉬업으로 카운트
4. 3D 공간에서의 정확한 거리 계산을 위해 벡터 연산 사용

```swift
// 거리 계산 코드 예시
let dx = cameraPos.x - facePos.x
let dy = cameraPos.y - facePos.y
let dz = cameraPos.z - facePos.z
let distance = sqrt(dx*dx + dy*dy + dz*dz)
```

## 프로젝트 구조

```
pushupApp/
├── ios/                      # iOS 네이티브 코드
│   ├── PushupManager.swift   # ARKit 관리 Swift 클래스
│   ├── PushupManager.m       # React Native 브릿지
│   ├── PushupRecognition.swift # 푸쉬업 인식 로직
│   └── pushupApp-Bridging-Header.h # Swift-Objective-C 브릿징 헤더
├── App.tsx                   # 메인 React Native 앱 코드
└── ...                       # 기타 React Native 프로젝트 파일
```

## 설치 방법

### 요구 사항

- Node.js 14.0 이상
- Xcode 12.0 이상
- iOS 14.0 이상 기기 (TrueDepth 카메라 필요)
- CocoaPods

### 설치 단계

1. 저장소 클론:

   ```bash
   git clone https://github.com/yourusername/pushupApp.git
   cd pushupApp
   ```

2. 의존성 설치:

   ```bash
   npm install
   cd ios && pod install && cd ..
   ```

3. iOS 앱 실행:
   ```bash
   npx react-native run-ios
   ```

## 사용 방법

1. 앱을 실행하고 시작 버튼을 누릅니다.
2. 기기를 푸쉬업 자세에서 얼굴이 보이도록 배치합니다.
3. 푸쉬업을 시작하면 앱이 자동으로 횟수를 카운트합니다.
4. 중지 버튼을 눌러 세션을 종료할 수 있습니다.

## 주의 사항

- 이 앱은 TrueDepth 카메라가 있는 iOS 기기(iPhone X 이상)에서만 작동합니다.
- 충분한 조명이 있는 환경에서 사용하세요.
- 푸쉬업 시 기기가 안전하게 배치되어 있는지 확인하세요.

## 기술적 제한 사항

- ARKit Face Tracking은 실제 기기에서만 작동하며 시뮬레이터에서는 테스트할 수 없습니다.
- 얼굴 인식의 정확도는 조명 조건과 사용자의 자세에 따라 달라질 수 있습니다.
- 배터리 소모가 높을 수 있으므로 장시간 사용 시 주의가 필요합니다.

## 향후 개발 계획

- 안드로이드 지원 (ARCore 활용)
- 다양한 운동 유형 감지 기능 추가
- 운동 통계 및 기록 기능
- 사용자 맞춤형 설정 옵션

## 라이선스

MIT License
