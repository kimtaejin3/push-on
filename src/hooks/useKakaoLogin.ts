import {useState} from 'react';
import {Alert} from 'react-native';
import {AuthService} from '../services/authService';

export const useKakaoLoginWithWebView = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showWebView, setShowWebView] = useState(false);
  const [webViewUrl, setWebViewUrl] = useState('');

  const handleKakaoLogin = async () => {
    try {
      setIsLoading(true);
      const {data, error} = await AuthService.signInWithKakao();

      if (!data) {
        Alert.alert('오류', '잘못된 OAuth URL입니다.');
        return;
      }

      if (error) {
        Alert.alert('로그인에 실패하였습니다. 고객센터에 문의해주세요.');
      } else {
        console.log('카카오 로그인 시작:', data);
        console.log('OAuth URL:', data.url);

        if (!data.url || !data.url.startsWith('https://')) {
          Alert.alert('오류', '잘못된 OAuth URL입니다.');
          return;
        }

        setWebViewUrl(data.url);
        setShowWebView(true);
      }
    } catch (error) {
      console.error('카카오 로그인 오류:', error);
      Alert.alert('오류', '로그인 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const closeWebView = () => {
    setShowWebView(false);
  };

  return {
    isLoading,
    showWebView,
    webViewUrl,
    handleKakaoLogin,
    closeWebView,
  };
};
