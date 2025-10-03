import {useEffect, useCallback} from 'react';
import {Linking, Alert} from 'react-native';
import {supabase} from '../lib/supabase';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {AppStackParamList} from '../navigations/AppNavigation';

interface UseDeepLinkProps {
  navigation: NativeStackNavigationProp<AppStackParamList>;
  onLoginSuccess?: () => void;
}

export const useDeepLink = ({navigation, onLoginSuccess}: UseDeepLinkProps) => {
  const handleDeepLink = useCallback(
    async (url: string) => {
      if (url.includes('login-callback')) {
        console.log('딥링크 감지:', url);

        try {
          // URL에서 토큰 추출
          const urlObj = new URL(url);
          const accessToken = urlObj.hash.match(/access_token=([^&]+)/)?.[1];
          const refreshToken = urlObj.hash.match(/refresh_token=([^&]+)/)?.[1];

          if (!accessToken || !refreshToken) {
            console.error('토큰을 찾을 수 없습니다.');
            Alert.alert('로그인 실패', '토큰을 찾을 수 없습니다.');
            return;
          }

          // 세션 설정
          const {error} = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            console.error('세션 설정 실패:', error);
            Alert.alert('로그인 실패', error.message);
          } else {
            // 로그인 성공 콜백 실행
            onLoginSuccess?.();

            // 메인 화면으로 이동
            console.log('navigation', navigation);
            if (navigation) {
              navigation.navigate('Tabs', {screen: 'Home'});
            }
          }
        } catch (error) {
          console.error('딥링크 처리 중 오류:', error);
          Alert.alert('오류', '로그인 처리 중 오류가 발생했습니다.');
        }
      }
    },
    [navigation, onLoginSuccess],
  );

  useEffect(() => {
    const subscription = Linking.addEventListener('url', ({url}) => {
      console.log('딥링크 URL:', url);
      handleDeepLink(url);
    });

    // 앱이 이미 열려있을 때 딥링크 처리
    Linking.getInitialURL().then(url => {
      if (url) {
        handleDeepLink(url);
      }
    });

    return () => subscription?.remove();
  }, [handleDeepLink]);

  return {handleDeepLink};
};
