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
import {isGuestUser, linkIdTokenToGuest} from '../remote/guest';

type SignInFailure = {
  status: 'failed';
  reason: 'play-services-unavailable' | 'sign-in';
  error?: unknown;
};

/** 게스트가 연결하려던 소셜 계정이 이미 다른 계정에 쓰이는 경우. 확인 뒤 continueSignIn 으로 그 계정에 로그인한다 */
type SignInExists = {status: 'exists'; continueSignIn: () => Promise<void>};

export type SignInResult =
  | {status: 'success'}
  | {status: 'cancelled'}
  | SignInExists
  | SignInFailure;

/** ID 토큰으로 로그인한다 (게스트 연결이 아닌 일반 로그인) */
const signInWithToken = async (provider: Provider, token: string, nonce?: string) => {
  const {error} = await supabase.auth.signInWithIdToken({provider, token, nonce});
  if (error) {
    throw error;
  }
};

/**
 * 게스트(익명)면 지금 계정에 소셜 계정을 연결하고(기록 유지), 아니면 그 계정으로 로그인한다.
 * 이미 다른 계정에 쓰이는 소셜 계정이면 'exists' 를 돌려 호출한 쪽이 확인 뒤 로그인하게 한다.
 */
const authenticate = async (
  provider: Provider,
  token: string,
  nonce?: string,
  afterSignIn?: () => Promise<void>,
): Promise<{status: 'success'} | SignInExists> => {
  const {
    data: {session},
  } = await supabase.auth.getSession();
  if (isGuestUser(session?.user)) {
    const linked = await linkIdTokenToGuest({provider, token, nonce});
    if (linked.status === 'linked') {
      await afterSignIn?.();
      return {status: 'success'};
    }
    if (linked.status === 'exists') {
      return {
        status: 'exists',
        continueSignIn: async () => {
          await signInWithToken(provider, token, nonce);
          await afterSignIn?.();
        },
      };
    }
    throw linked.error;
  }
  await signInWithToken(provider, token, nonce);
  await afterSignIn?.();
  return {status: 'success'};
};

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

      return await authenticate('google', userInfo.idToken);
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

      return await authenticate('kakao', token.idToken);
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
      // 회원 탈퇴 시 애플 토큰을 revoke 하려면 로그인(연결) 뒤 authorizationCode 를 저장해 둔다.
      const code = credential.authorizationCode;
      return await authenticate(
        'apple',
        credential.identityToken,
        credential.nonce,
        code ? () => linkAppleToken(code) : undefined,
      );
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

  const signOut = async (provider: Provider | 'anonymous') => {
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
