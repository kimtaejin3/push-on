import {useState} from 'react';
import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import {supabase} from '../lib/supabase';
import {login, logout} from '@react-native-seoul/kakao-login';
import {appleAuth} from '@invertase/react-native-apple-authentication';
import {Provider} from '../types/auth';
import {linkAppleToken} from '../remote/apple';

type SignInFailure = {
  status: 'failed';
  reason: 'play-services-unavailable' | 'sign-in';
  error?: unknown;
};

type SignInResult = {status: 'success'} | {status: 'cancelled'} | SignInFailure;

const getErrorCode = (error: unknown) =>
  typeof error === 'object' && error !== null && 'code' in error
    ? error.code
    : undefined;

export const useAuth = () => {
  const [isLoading, setIsLoading] = useState(false);

  const signInWithGoogle = async (): Promise<SignInResult> => {
    try {
      setIsLoading(true);

      if (!(await GoogleSignin.hasPlayServices())) {
        return {status: 'failed', reason: 'play-services-unavailable'};
      }

      const {type, data: userInfo} = await GoogleSignin.signIn();
      if (type === 'cancelled') {
        return {status: 'cancelled'};
      }
      if (!userInfo?.idToken) {
        throw new Error('Google ID 토큰을 받지 못했습니다.');
      }

      const {error} = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: userInfo.idToken,
      });

      if (error) {
        throw error;
      }
      return {status: 'success'};
    } catch (error) {
      const code = getErrorCode(error);
      if (
        code !== undefined &&
        (code === statusCodes.SIGN_IN_CANCELLED ||
          code === statusCodes.IN_PROGRESS)
      ) {
        return {status: 'cancelled'};
      }
      if (
        code !== undefined &&
        code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE
      ) {
        return {status: 'failed', reason: 'play-services-unavailable', error};
      }
      console.error('Google 로그인 에러:', error);
      return {status: 'failed', reason: 'sign-in', error};
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithKakao = async (): Promise<SignInResult> => {
    try {
      setIsLoading(true);

      const token = await login();
      if (!token.idToken) {
        throw new Error('카카오 ID 토큰을 받지 못했습니다.');
      }

      const {error} = await supabase.auth.signInWithIdToken({
        provider: 'kakao',
        token: token.idToken,
      });

      if (error) {
        throw error;
      }
      return {status: 'success'};
    } catch (error) {
      if (getErrorCode(error) === 'CANCELLED') {
        return {status: 'cancelled'};
      }
      console.error('카카오 로그인 에러:', error);
      return {status: 'failed', reason: 'sign-in', error};
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithApple = async (): Promise<SignInResult> => {
    try {
      setIsLoading(true);

      // 라이브러리는 기본값(nonceEnabled: true)으로 nonce 를 만들어 해시를 애플에 보내고,
      // 원본을 credential.nonce 로 돌려준다.
      const credential = await appleAuth.performRequest({
        requestedOperation: appleAuth.Operation.LOGIN,
        requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
      });

      if (!credential.identityToken) {
        throw new Error('Apple ID 토큰을 받지 못했습니다.');
      }

      // identityToken 에 nonce 클레임이 들어 있으므로 원본 nonce 를 같이 넘겨야 한다.
      const {error} = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: credential.identityToken,
        nonce: credential.nonce,
      });

      if (error) {
        throw error;
      }

      // 회원 탈퇴 시 애플 토큰을 revoke 하려면 authorizationCode 가 필요하다.
      if (credential.authorizationCode) {
        await linkAppleToken(credential.authorizationCode);
      }

      return {status: 'success'};
    } catch (error) {
      const code = getErrorCode(error);
      if (code !== undefined && code === appleAuth.Error?.CANCELED) {
        return {status: 'cancelled'};
      }
      console.error('애플 로그인 에러:', error);
      return {status: 'failed', reason: 'sign-in', error};
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
