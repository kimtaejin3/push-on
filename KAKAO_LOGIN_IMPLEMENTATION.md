# Supabase 카카오 로그인 구현 가이드

## 📋 구현 개요

React Native 앱에서 Supabase를 통한 카카오 OAuth 로그인을 구현했습니다. 이 구현은 웹뷰 기반 OAuth 플로우를 사용하여 카카오 계정으로 로그인할 수 있도록 합니다.

## 🛠️ 설치된 패키지

```bash
npm install @react-native-async-storage/async-storage react-native-url-polyfill react-native-linking
```

### 패키지 설명

- `@react-native-async-storage/async-storage`: Supabase 세션 저장을 위한 로컬 스토리지
- `react-native-url-polyfill`: React Native에서 URL API 사용을 위한 폴리필
- `react-native-linking`: 딥링크 처리를 위한 React Native 내장 모듈

## 📁 파일 구조

```
src/
├── config/
│   └── supabase.ts          # Supabase 클라이언트 설정
├── services/
│   └── authService.ts       # 인증 서비스 로직
├── types/
│   └── env.d.ts            # 환경변수 타입 정의
└── screens/
    └── AuthScreen.tsx      # 로그인 화면 (카카오 로그인 버튼 포함)
```

## 🔧 구현 세부사항

### 1. Supabase 클라이언트 설정 (`src/config/supabase.ts`)

```typescript
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {createClient} from '@supabase/supabase-js';
import {SUPABASE_URL, SUPABASE_ANON_KEY} from '@env';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage, // 세션을 AsyncStorage에 저장
    autoRefreshToken: true, // 토큰 자동 갱신
    persistSession: true, // 세션 지속성
    detectSessionInUrl: false, // URL에서 세션 감지 비활성화 (딥링크로 처리)
  },
});
```

**주요 설정:**

- `AsyncStorage`를 사용하여 세션을 로컬에 저장
- `autoRefreshToken: true`로 토큰 자동 갱신
- `detectSessionInUrl: false`로 설정하여 딥링크로 OAuth 콜백 처리

### 2. 인증 서비스 (`src/services/authService.ts`)

```typescript
export class AuthService {
  // 카카오 OAuth 로그인
  static async signInWithKakao() {
    try {
      const {data, error} = await supabase.auth.signInWithOAuth({
        provider: 'kakao',
        options: {
          redirectTo: 'pushupapp://auth/callback', // 딥링크 URL
        },
      });

      if (error) throw error;
      return {data, error: null};
    } catch (error) {
      return {data: null, error};
    }
  }

  // 기타 인증 메서드들...
}
```

**OAuth 플로우:**

1. `signInWithOAuth` 호출
2. Supabase가 카카오 OAuth 웹뷰 열기
3. 사용자가 카카오에서 로그인
4. `pushupapp://auth/callback` 딥링크로 앱 복귀
5. 딥링크 핸들러에서 세션 처리

### 3. AuthScreen 구현 (`src/screens/AuthScreen.tsx`)

#### 딥링크 처리

```typescript
useEffect(() => {
  const handleDeepLink = (url: string) => {
    if (url.includes('auth/callback')) {
      // Supabase OAuth 콜백 처리
      supabase.auth.getSession().then(({data: {session}}) => {
        if (session) {
          console.log('OAuth 로그인 성공:', session.user);
          // 메인 화면으로 이동
        }
      });
    }
  };

  const subscription = Linking.addEventListener('url', ({url}) => {
    handleDeepLink(url);
  });

  // 앱이 이미 열려있을 때 딥링크 처리
  Linking.getInitialURL().then(url => {
    if (url) {
      handleDeepLink(url);
    }
  });

  return () => subscription?.remove();
}, []);
```

#### 카카오 로그인 버튼

```typescript
const handleKakaoLogin = async () => {
  try {
    setIsLoading(true);
    const {data, error} = await AuthService.signInWithKakao();

    if (error) {
      Alert.alert('로그인 실패', error.message);
    } else {
      console.log('카카오 로그인 시작:', data);
      // OAuth 웹뷰가 열리고, 콜백에서 딥링크로 처리됨
    }
  } catch (error) {
    console.error('카카오 로그인 오류:', error);
    Alert.alert('오류', '로그인 중 오류가 발생했습니다.');
  } finally {
    setIsLoading(false);
  }
};
```

#### UI 상태 관리

- 로딩 상태 표시 (`ActivityIndicator`)
- 버튼 비활성화 (`disabled={isLoading}`)
- 시각적 피드백 (`opacity: 0.6`)

### 4. 네이티브 설정

#### iOS (`ios/pushupApp/Info.plist`)

```xml
<key>CFBundleURLTypes</key>
<array>
    <dict>
        <key>CFBundleURLName</key>
        <string>pushupapp</string>
        <key>CFBundleURLSchemes</key>
        <array>
            <string>pushupapp</string>
        </array>
    </dict>
</array>
```

#### Android (`android/app/src/main/AndroidManifest.xml`)

```xml
<intent-filter android:autoVerify="true">
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data android:scheme="pushupapp" />
</intent-filter>
```

## 🔐 Supabase 설정 요구사항

### 1. Supabase Dashboard 설정

1. **Authentication → Providers → Kakao** 활성화
2. **Redirect URLs**에 다음 추가:
   - `pushupapp://auth/callback`
   - `https://your-project-id.supabase.co/auth/v1/callback`

### 2. 카카오 Developers Console 설정

1. **내 애플리케이션** → **앱 설정** → **플랫폼**
2. **Web 플랫폼 등록**:
   - 사이트 도메인: `https://your-project-id.supabase.co`
3. **제품 설정** → **카카오 로그인** → **Redirect URI**:
   - `https://your-project-id.supabase.co/auth/v1/callback`

### 3. 환경변수 설정 (`.env`)

```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

## 🚀 사용 방법

### 1. 앱 실행

```bash
npx react-native start --reset-cache
```

### 2. 카카오 로그인 플로우

1. 사용자가 "카카오로 시작하기" 버튼 클릭
2. 카카오 OAuth 웹뷰가 열림
3. 사용자가 카카오 계정으로 로그인
4. `pushupapp://auth/callback` 딥링크로 앱 복귀
5. 세션이 자동으로 저장되고 메인 화면으로 이동

## 🔍 디버깅

### 로그 확인

```typescript
// 콘솔에서 확인할 수 있는 로그들
console.log('카카오 로그인 시작:', data);
console.log('OAuth 로그인 성공:', session.user);
console.error('카카오 로그인 오류:', error);
```

### 일반적인 문제들

1. **딥링크가 작동하지 않는 경우**: URL Scheme 설정 확인
2. **OAuth 콜백이 처리되지 않는 경우**: Supabase Redirect URL 설정 확인
3. **세션이 저장되지 않는 경우**: AsyncStorage 권한 확인

## 📱 테스트

### iOS 시뮬레이터

```bash
npx react-native run-ios
```

### Android 에뮬레이터

```bash
npx react-native run-android
```

### 딥링크 테스트

```bash
# iOS
xcrun simctl openurl booted "pushupapp://auth/callback"

# Android
adb shell am start -W -a android.intent.action.VIEW -d "pushupapp://auth/callback" com.pushupapp
```

## 🔄 향후 개선사항

1. **자동 로그인**: 앱 시작 시 저장된 세션 확인
2. **로그아웃 기능**: 카카오 계정과 Supabase 세션 모두 로그아웃
3. **사용자 프로필**: 카카오에서 받은 프로필 정보를 Supabase에 저장
4. **에러 처리**: 더 상세한 에러 메시지와 사용자 가이드
5. **로딩 상태**: 더 나은 로딩 UI/UX

## 📚 참고 자료

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [React Native Linking](https://reactnative.dev/docs/linking)
- [카카오 로그인 REST API](https://developers.kakao.com/docs/latest/ko/kakaologin/rest-api)
- [React Native AsyncStorage](https://react-native-async-storage.github.io/async-storage/)

---

이 구현을 통해 React Native 앱에서 Supabase를 통한 카카오 OAuth 로그인을 성공적으로 구현할 수 있습니다. 모든 설정이 올바르게 되어 있다면 사용자는 카카오 계정으로 간편하게 로그인할 수 있습니다.
