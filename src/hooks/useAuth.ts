import {useState} from 'react';
import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import {supabase} from '../lib/supabase';
import {Alert} from 'react-native';
import {login, logout} from '@react-native-seoul/kakao-login';
import {appleAuth} from '@invertase/react-native-apple-authentication';
import {Provider} from '../types/auth';
import {linkAppleToken} from '../remote/apple';

export const useAuth = () => {
  const [isLoading, setIsLoading] = useState(false);

  const signInWithGoogle = async () => {
    try {
      setIsLoading(true);

      // Google Play Services 확인
      await GoogleSignin.hasPlayServices();

      // Google 로그인 실행
      const {data: userInfo} = await GoogleSignin.signIn();

      if (userInfo === null) {
        throw new Error('사용자 정보를 받지 못했습니다.');
      }
      if (userInfo.idToken === null) {
        throw new Error('Google ID 토큰을 받지 못했습니다.');
      }

    const {data, error} = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: userInfo.idToken,
    });

    if (error) {
        console.error('Google 로그인 에러:', error);
        console.error(error.message);
        Alert.alert('로그인 실패', error.message);
    } else {
        Alert.alert('로그인 성공', 'Google 계정으로 로그인되었습니다.');
    }

    return {data, error};
} catch (error: any) {
      console.error('Google 로그인 에러:', error);

      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        // 사용자가 로그인을 취소함
      } else if (error.code === statusCodes.IN_PROGRESS) {
        // 이미 로그인 진행 중
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        // Google Play Services가 사용 불가능
        Alert.alert('오류', 'Google Play Services를 사용할 수 없습니다.');
      } else {
        // 기타 오류
        Alert.alert('로그인 실패', 'Google 로그인 중 오류가 발생했습니다.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithKakao = async () => {
    try {
      setIsLoading(true);

      const token = await login();

      if (token.idToken) {
        // Supabase에 카카오 ID 토큰으로 로그인
        const {data, error} = await supabase.auth.signInWithIdToken({
          provider: 'kakao',
          token: token.idToken,
        });

        if (error) {
          console.error('Supabase 로그인 에러:', error);
          Alert.alert('로그인 실패', error.message);
        } else {
          Alert.alert('로그인 성공', '카카오 계정으로 로그인되었습니다.');
        }

        return {data, error};
      } else {
        throw new Error('카카오 ID 토큰을 받지 못했습니다.');
      }
    } catch (error: any) {
      console.error('카카오 로그인 에러:', error);
      console.error('에러 상세:', JSON.stringify(error, null, 2));

      if (error.code === 'CANCELLED') {
        // 사용자가 카카오 로그인을 취소했습니다.
      } else if (error.message) {
        console.error('에러 메시지:', error.message);
        Alert.alert('로그인 실패', `카카오 로그인 오류: ${error.message}`);
      } else {
        Alert.alert('로그인 실패', '카카오 로그인 중 오류가 발생했습니다.');
      }

      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithApple = async () => {
    try {
      setIsLoading(true);

      // nonce 는 넘기지 않는다 — Supabase 의 React Native 애플 로그인 예제와 동일한 방식
      const credential = await appleAuth.performRequest({
        requestedOperation: appleAuth.Operation.LOGIN,
        requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
      });

      if (!credential.identityToken) {
        throw new Error('Apple ID 토큰을 받지 못했습니다.');
      }

      const {data, error} = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: credential.identityToken,
      });

      if (error) {
        console.error('Supabase 애플 로그인 에러:', error);
        Alert.alert('로그인 실패', error.message);
        return {data, error};
      }

      // 회원 탈퇴 시 애플 토큰을 revoke 하려면 authorizationCode 가 필요하다.
      // 실패해도 로그인 자체는 성공으로 둔다 (다음 로그인 때 다시 시도된다).
      if (credential.authorizationCode) {
        await linkAppleToken(credential.authorizationCode);
      }

      return {data, error};
    } catch (error: any) {
      // 사용자가 취소한 경우는 조용히 넘어간다
      if (error?.code === appleAuth.Error?.CANCELED) {
        return;
      }
      console.error('애플 로그인 에러:', error);
      Alert.alert('로그인 실패', 'Apple 로그인 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async (provider: Provider) => {
    // provider SDK 로그아웃은 best-effort. 카카오는 자체 토큰이 만료돼 있으면
    // 서버 호출이 실패하는데, 그것 때문에 Supabase 세션 제거를 건너뛰면 안 된다.
    // 애플은 SDK 로그아웃 개념이 없어 Supabase 세션만 정리하면 된다.
    try {
      if (provider === 'google') {
        await GoogleSignin.signOut();
      } else if (provider === 'kakao') {
        await logout();
      }
    } catch (error) {
      console.warn(`${provider} 로그아웃 실패 (무시하고 계속 진행):`, error);
    }

    const {error: signOutError} = await supabase.auth.signOut();
    if (signOutError) {
      console.error('Supabase 로그아웃 에러:', signOutError);
      throw signOutError;
    }
  };

  const signInWithProvider = (provider: Provider) => {
    switch (provider) {
      case 'google':
        return signInWithGoogle();
      case 'apple':
        return signInWithApple();
      default:
        return signInWithKakao();
    }
  };

  return {
    signInWithProvider,
    signOut,
    isLoading,
  };
};
