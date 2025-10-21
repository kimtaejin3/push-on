import {useState} from 'react';
import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import {supabase} from '../lib/supabase';
import {Alert} from 'react-native';

export const useGoogleLogin = () => {
  const [isLoading, setIsLoading] = useState(false);

  const signInWithGoogle = async () => {
    try {
      setIsLoading(true);

      // Google Play Services 확인
      await GoogleSignin.hasPlayServices();

      // Google 로그인 실행
      const {data: userInfo} = await GoogleSignin.signIn();

      if (userInfo?.idToken) {
        console.log('Google ID 토큰으로 로그인 시도');
        // Supabase에 Google ID 토큰으로 로그인
        const {data, error} = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: userInfo.idToken,
        });

        if (error) {
          console.error('Google 로그인 에러:', error);
          Alert.alert('로그인 실패', error.message);
        } else {
          console.log('Google 로그인 성공:', data);
          Alert.alert('로그인 성공', 'Google 계정으로 로그인되었습니다.');
        }
      } else {
        throw new Error('Google ID 토큰을 받지 못했습니다.');
      }
    } catch (error: any) {
      console.error('Google 로그인 에러:', error);

      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        // 사용자가 로그인을 취소함
        console.log('사용자가 Google 로그인을 취소했습니다.');
      } else if (error.code === statusCodes.IN_PROGRESS) {
        // 이미 로그인 진행 중
        console.log('Google 로그인이 이미 진행 중입니다.');
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

  const signOut = async () => {
    try {
      await GoogleSignin.signOut();
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Google 로그아웃 에러:', error);
    }
  };

  return {
    signInWithGoogle,
    signOut,
    isLoading,
  };
};
