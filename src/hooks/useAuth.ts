import {useState} from 'react';
import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import {supabase} from '../lib/supabase';
import {Alert} from 'react-native';
import {login, logout} from '@react-native-seoul/kakao-login';
import { providers } from '../types/auth';

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

  const signOut = async (provider: typeof providers[number]) => {
    try {
      if (provider === 'google') {
        await GoogleSignin.signOut();
      } else if (provider === 'kakao') {
        await logout();
      }
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Google 로그아웃 에러:', error);
    }
  };

  return {
    signInWithProvider: (provider: typeof providers[number]) => provider === 'google' ? signInWithGoogle() : signInWithKakao(),
    signOut,
    isLoading,
  };
};
