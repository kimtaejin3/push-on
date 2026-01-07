import {useState} from 'react';
import {login, logout} from '@react-native-seoul/kakao-login';
import {supabase} from '../lib/supabase';
import {Alert} from 'react-native';

export const useKakaoLoginNative = () => {
  const [isLoading, setIsLoading] = useState(false);

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

  const signOutKakao = async () => {
    try {
      await logout();
      await supabase.auth.signOut();
    } catch (error) {
      console.error('카카오 로그아웃 에러:', error);
    }
  };

  return {
    signInWithKakao,
    signOutKakao,
    isLoading,
  };
};
