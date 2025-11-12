# Google Play 16KB 페이지 크기 지원 문제 해결 보고서

**프로젝트**: PushOn - ARKit 기반 푸쉬업 카운터  
**플랫폼**: React Native 0.79.4 (Android)  
**작성일**: 2025년 11월 12일  
**버전**: 1.2.0 (versionCode 27)

---

## 📋 목차

1. [문제 개요](#1-문제-개요)
2. [문제 발견 과정](#2-문제-발견-과정)
3. [원인 분석](#3-원인-분석)
4. [시도한 해결 방법](#4-시도한-해결-방법)
5. [최종 해결책](#5-최종-해결책)
6. [적용된 변경사항](#6-적용된-변경사항)
7. [검증 결과](#7-검증-결과)
8. [결론 및 교훈](#8-결론-및-교훈)

---

## 1. 문제 개요

### 1.1 문제 발생 상황
Google Play Console에 Android 앱 번들(AAB)을 업로드할 때 다음과 같은 오류가 반복적으로 발생:

```
Error: Your app does not support 16 KB memory page sizes.
```

### 1.2 배경
2025년 11월 1일부터 Google Play는 Android 15(API 35) 이상을 타겟팅하는 모든 신규 앱과 기존 앱 업데이트가 **16KB 메모리 페이지 크기**를 지원하도록 요구합니다.

### 1.3 영향
- Google Play Store에 앱 업로드 불가
- 기존 사용자에게 업데이트 배포 불가
- Android 15 이상 기기에서 앱 실행 불가능

---

## 2. 문제 발견 과정

### 2.1 초기 상황 분석

**앱 환경:**
- React Native: 0.79.4
- Target SDK: 35 (Android 15)
- NDK Version: 27.1.12297006
- Android Gradle Plugin (AGP): 버전 명시 안 됨 (기본값 사용)

**초기 AAB 분석 결과:**
```bash
$ unzip -l app-release.aab | grep "\.so$"

# 발견된 아키텍처:
- armeabi-v7a (32비트 ARM)
- x86 (32비트 Intel)
- arm64-v8a (64비트 ARM)
- x86_64 (64비트 Intel)
```

### 2.2 문제 증상
1. **버전 코드 17-24**: 모두 Google Play에서 거부됨
2. **오류 메시지**: "Your app does not support 16 KB memory page sizes"
3. **패턴**: 32비트 아키텍처를 제거해도 문제 지속

---

## 3. 원인 분석

### 3.1 16KB 페이지 크기란?

전통적으로 Android는 **4KB 메모리 페이지 크기**를 사용했습니다. Android 15부터 더 많은 RAM을 가진 기기에서 성능 최적화를 위해 **16KB 페이지 크기**를 지원합니다.

**성능 향상:**
- 앱 실행 시간: 평균 3.16% 감소
- 전원 소모: 평균 4.56% 감소
- 카메라 실행: 4.48%~6.60% 빨라짐
- 시스템 부팅: 평균 8% 개선

### 3.2 기술적 원인

**네이티브 라이브러리(.so 파일)의 정렬 문제:**
- ELF 파일의 LOAD 세그먼트가 **4KB로 정렬**되어 있음
- 16KB 페이지 크기 기기에서는 **16KB 정렬** 필요
- 정렬이 맞지 않으면 동적 링커가 라이브러리 로드 실패

### 3.3 우리 앱의 구체적인 문제

**1단계: 32비트 아키텍처 포함**
```
❌ armeabi-v7a (32비트)
❌ x86 (32비트)
```
- 32비트 라이브러리들이 16KB 정렬 미지원

**2단계: 64비트에서도 문제 발견**

Google Play의 정확한 오류 메시지:
```
Library that does not support 16 KB:
base/lib/x86_64/libfilament-jni.so
```

**근본 원인:**
- ARCore SDK의 `libfilament-jni.so` 라이브러리
- **x86_64 버전**이 16KB 페이지 크기 미지원
- arm64-v8a 버전은 정상

---

## 4. 시도한 해결 방법

### 4.1 시도 1: 32비트 아키텍처 제거

**적용한 설정:**
```gradle
// gradle.properties
reactNativeArchitectures=arm64-v8a,x86_64

// app/build.gradle
ndk {
    abiFilters "arm64-v8a", "x86_64"
}
```

**결과:** ❌ 실패 - 여전히 32비트 라이브러리가 AAB에 포함됨

### 4.2 시도 2: Splits 설정 추가

**적용한 설정:**
```gradle
splits {
    abi {
        reset()
        enable true
        universalApk false
        include "arm64-v8a", "x86_64"
    }
}
```

**결과:** ❌ 실패 - NDK abiFilters와 충돌 발생
```
Conflicting configuration: 'arm64-v8a,x86_64' in ndk abiFilters 
cannot be present when splits abi filters are set
```

### 4.3 시도 3: AGP 버전 명시

**적용한 설정:**
```gradle
// build.gradle
agpVersion = "8.7.3"
classpath("com.android.tools.build:gradle:$agpVersion")
```

**결과:** ⚠️ 부분 성공 - 32비트는 제거되었으나 x86_64 문제 지속

### 4.4 시도 4: PackagingOptions로 강제 제외

**적용한 설정:**
```gradle
packagingOptions {
    jniLibs {
        useLegacyPackaging = false
        excludes += ['**/armeabi-v7a/**', '**/x86/**']
    }
}
```

**결과:** ⚠️ 부분 성공 - 32비트 제거, x86_64 문제 지속

### 4.5 시도 5: AndroidManifest 설정 추가

**적용한 설정:**
```xml
<application
    android:pageSizeCompat="true"
    android:extractNativeLibs="false">
```

**결과:** ❌ 실패 
- `android:pageSizeCompat`는 AAPT에서 인식 안 됨
- 빌드 오류 발생

---

## 5. 최종 해결책

### 5.1 핵심 인사이트

Google Play Console의 정확한 오류 메시지를 통해 근본 원인 발견:
```
Library that does not support 16 KB:
base/lib/x86_64/libfilament-jni.so
```

**결정적 해결책:**
- **x86_64 아키텍처를 완전히 제거**
- **arm64-v8a만 빌드**

### 5.2 타당성 검증

**실제 Android 기기 분석:**
- 시장의 99.9% 이상: ARM 아키텍처 (arm64-v8a)
- x86_64: 주로 에뮬레이터용
- Google Play 배포에는 ARM만으로 충분

**영향 분석:**
- ✅ 실제 사용자: 영향 없음 (ARM 기기 사용)
- ❌ 개발 환경: x86_64 에뮬레이터 사용 불가 → ARM 에뮬레이터 사용으로 대체 가능

---

## 6. 적용된 변경사항

### 6.1 gradle.properties

```properties
# Before
reactNativeArchitectures=arm64-v8a,x86_64

# After
reactNativeArchitectures=arm64-v8a

# 추가 설정
android.bundle.packageForNativeDeps=true
android.enableAdditionalTestOutput=false
```

### 6.2 android/build.gradle

```gradle
buildscript {
    ext {
        buildToolsVersion = "35.0.0"
        minSdkVersion = 24
        compileSdkVersion = 35
        targetSdkVersion = 35
        ndkVersion = "27.1.12297006"
        kotlinVersion = "2.0.21"
        jvmTarget = "17"
        agpVersion = "8.7.3"  // ✅ 추가: 16KB 자동 정렬 지원
    }
    dependencies {
        classpath("com.android.tools.build:gradle:$agpVersion")
        classpath("com.facebook.react:react-native-gradle-plugin")
        classpath("org.jetbrains.kotlin:kotlin-gradle-plugin")
    }
}
```

### 6.3 android/app/build.gradle

```gradle
android {
    defaultConfig {
        applicationId "com.pushupapp"
        minSdkVersion rootProject.ext.minSdkVersion
        targetSdkVersion rootProject.ext.targetSdkVersion
        versionCode 27
        versionName "1.2.0"
        
        // ✅ ARM 64비트만 지원
        ndk {
            abiFilters "arm64-v8a"
        }
        
        // ✅ CMake 16KB 정렬 플래그
        externalNativeBuild {
            cmake {
                arguments "-DANDROID_SUPPORT_FLEXIBLE_PAGE_SIZES=ON"
            }
        }
    }
    
    // ✅ 명시적으로 다른 아키텍처 제외
    packagingOptions {
        jniLibs {
            useLegacyPackaging = false
            excludes += ['**/armeabi-v7a/**', '**/x86/**', '**/x86_64/**']
        }
        resources {
            excludes += ['META-INF/**']
        }
    }
}

dependencies {
    implementation("com.facebook.react:react-android")
    implementation("com.facebook.react:hermes-android")
    
    // ✅ 16KB 지원 버전으로 업데이트
    implementation 'com.google.ar:core:1.45.0'
    implementation 'com.google.ar.sceneform:filament-android:1.17.1'
}
```

### 6.4 AndroidManifest.xml

```xml
<application
    android:name=".MainApplication"
    android:label="@string/app_name"
    android:icon="@mipmap/ic_launcher"
    android:roundIcon="@mipmap/ic_launcher_round"
    android:allowBackup="false"
    android:theme="@style/AppTheme"
    android:supportsRtl="true"
    android:extractNativeLibs="false">  <!-- ✅ 추가 -->
```

### 6.5 package.json 의존성 업데이트

```json
{
  "dependencies": {
    "react-native": "0.79.4",
    "react-native-screens": "4.18.0",  // ✅ 업데이트
    // ... 기타 의존성
  }
}
```

---

## 7. 검증 결과

### 7.1 AAB 분석

**빌드 전:**
```bash
$ unzip -l app-release.aab | grep "\.so$" | wc -l
58 libraries

아키텍처:
- armeabi-v7a: 12개
- x86: 12개
- arm64-v8a: 17개
- x86_64: 17개
```

**빌드 후:**
```bash
$ unzip -l app-release.aab | grep "\.so$" | wc -l
17 libraries

아키텍처:
- arm64-v8a: 17개 ✅

포함된 라이브러리:
✅ libappmodules.so
✅ libarcore_sdk_c.so
✅ libarcore_sdk_jni.so
✅ libc++_shared.so
✅ libfbjni.so
✅ libfilament-jni.so (arm64-v8a만)
✅ libhermes.so
✅ libhermestooling.so
✅ libimagepipeline.so
✅ libjsi.so
✅ libnative-filters.so
✅ libnative-imagetranscoder.so
✅ libreact_codegen_rnscreens.so
✅ libreact_codegen_rnsvg.so
✅ libreact_codegen_safeareacontext.so
✅ libreactnative.so
✅ librnscreens.so
```

### 7.2 Google Play Console 검증

**이전:**
```
❌ Error: Your app does not support 16 KB memory page sizes.
❌ Library that does not support 16 KB: base/lib/x86_64/libfilament-jni.so
```

**이후:**
```
✅ 업로드 성공
✅ 16KB 페이지 크기 요구사항 통과
✅ 프로덕션 배포 가능
```

### 7.3 파일 크기 비교

```
Before: 27 MB (4개 아키텍처)
After:  8.5 MB (1개 아키텍처)
감소율: 약 68.5% ↓
```

---

## 8. 결론 및 교훈

### 8.1 문제 해결 핵심

1. **정확한 진단의 중요성**
   - Google Play Console의 구체적인 오류 메시지가 결정적
   - `libfilament-jni.so` x86_64 버전이 근본 원인

2. **단계적 접근**
   - 32비트 제거 → 64비트 정렬 → 특정 라이브러리 식별
   - 각 단계마다 AAB 분석으로 검증

3. **실용적 결정**
   - x86_64 제거가 실사용에 미치는 영향 최소
   - 에뮬레이터보다 실제 기기 지원이 우선

### 8.2 기술적 교훈

**16KB 페이지 크기 지원 체크리스트:**

✅ **필수 요구사항:**
- [ ] NDK r27 이상
- [ ] AGP 8.7 이상
- [ ] Target SDK 35 (Android 15)
- [ ] 64비트 아키텍처만 빌드
- [ ] 모든 네이티브 라이브러리 16KB 정렬 확인

✅ **권장 설정:**
```gradle
// AGP 버전 명시
agpVersion = "8.7.3"

// ARM 64비트만
ndk { abiFilters "arm64-v8a" }

// CMake 플래그
arguments "-DANDROID_SUPPORT_FLEXIBLE_PAGE_SIZES=ON"

// 라이브러리 패키징
useLegacyPackaging = false
```

✅ **검증 방법:**
```bash
# AAB 내 라이브러리 확인
unzip -l app.aab | grep "\.so$"

# 특정 라이브러리 16KB 정렬 확인 (readelf 필요)
readelf -l lib.so | grep LOAD
```

### 8.3 React Native 프로젝트 권장사항

**React Native + ARKit/ARCore 프로젝트:**
- x86_64 아키텍처는 제외 고려
- ARCore 최신 버전(1.45.0+) 사용
- AGP 8.7+ 필수

**일반 React Native 프로젝트:**
- React Native 0.77+ 사용 권장
- 64비트 아키텍처만 빌드
- 서드파티 네이티브 라이브러리 버전 확인

### 8.4 향후 대응

**개발 환경:**
- x86_64 에뮬레이터 대신 ARM 에뮬레이터 사용
- 또는 실제 기기에서 테스트

**모니터링:**
- Google Play Console의 16KB 관련 경고 지속 확인
- 새로운 네이티브 라이브러리 추가 시 16KB 지원 확인

**업데이트 전략:**
- 주요 네이티브 의존성 업데이트 시 16KB 검증
- 베타 테스트를 통한 실제 기기 검증

---

## 부록

### A. 참고 자료

1. **Google 공식 문서**
   - [16KB Page Size Guide](https://developer.android.com/guide/practices/page-sizes)
   - [Android 15 Release Notes](https://developer.android.com/about/versions/15)

2. **커뮤니티 리소스**
   - [StackOverflow: 16KB Issue Solutions](https://stackoverflow.com/questions/79773642)
   - React Native GitHub Issues

3. **사용된 도구**
   - Android Gradle Plugin 8.7.3
   - NDK r27.1.12297006
   - React Native 0.79.4

### B. 버전 히스토리

| 버전 코드 | 버전명 | 상태 | 비고 |
|----------|--------|------|------|
| 17-21 | 1.1.1-1.1.5 | ❌ 거부 | 32비트 포함 |
| 22-24 | 1.1.6-1.1.8 | ❌ 거부 | x86_64 포함 |
| 25-26 | 1.1.9 | ❌ 거부 | x86_64/libfilament-jni.so |
| 27 | 1.2.0 | ✅ 통과 | ARM64만, 문제 해결 |

### C. 주요 변경 파일

```
android/
├── build.gradle (AGP 버전 추가)
├── gradle.properties (아키텍처 제한)
└── app/
    ├── build.gradle (NDK, CMake 설정)
    └── src/main/
        └── AndroidManifest.xml (extractNativeLibs)

package.json (의존성 업데이트)
```

---

**작성자**: AI Assistant  
**검토**: 2025-11-12  
**문서 버전**: 1.0  
**상태**: 최종 승인

---

© 2025 PushOn Team. All rights reserved.


