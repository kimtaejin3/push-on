import React, {useEffect} from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Fontawesome5 from '@react-native-vector-icons/fontawesome5';
import {SvgXml} from 'react-native-svg';
import {useAuth} from '../hooks/useAuth';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {AppStackParamList} from '../navigations/AppNavigation';
import {useNavigation} from '@react-navigation/native';
import {colors} from '../constants/colors';
import {useDeepLink} from '../hooks/useDeepLink';
import KakaoWebView from '../components/features/webview/KakaoWebView';
import {useKakaoLoginWithWebView} from '../hooks/useKakaoLogin';

const logoSvg = `<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="-5.0 -10.0 110.0 135.0">
  <path d="m25.641 46.875c2.3047 0.007812 4.5898-0.44531 6.7188-1.3281-1.2812-0.51953-2.4961-1.1953-3.6094-2.0156-0.95703-0.6875-1.8477-1.4688-2.6562-2.3281-0.55859-0.5625-1.0781-1.1562-1.5625-1.7812l2.0938-1.5625c0.79297 1.0234 1.6992 1.9531 2.7031 2.7656 1.8086 1.5156 3.9492 2.5859 6.25 3.125l1.1406 0.28125c1.1289 0.19922 2.2734 0.29688 3.4219 0.29688 2.1562-0.011719 4.3008-0.31641 6.375-0.90625-0.18359-0.94531-0.41797-1.8789-0.70312-2.7969-0.22656-0.83594-0.5-1.6602-0.8125-2.4688-0.95703-2.4688-2.25-4.793-3.8438-6.9062l2.1094-1.5625c1.7461 2.3281 3.1602 4.8906 4.2031 7.6094 0.3125 0.84375 0.59375 1.6719 0.8125 2.4844 0.27734 0.97656 0.50391 1.9688 0.67188 2.9688 0.17578 0.9375 0.30078 1.8438 0.375 2.7188 0.33594 3.5156 0.035156 7.0625-0.89062 10.469-0.22656 0.75 0.13281 1.5508 0.84375 1.875l14.062 5.9688c0.1875 0.078125 0.39062 0.12109 0.59375 0.125 0.59375-0.015625 1.125-0.36719 1.375-0.90625 0.67188-1.5625 16.438-37.5 7.3906-49.203-8.0625-10.484-32.078-3.1406-38.328-0.98438-0.32812 0.09375-0.60938 0.20312-0.82812 0.28125-0.23828-0.14844-0.48438-0.28125-0.73438-0.40625-2.2383-0.97656-4.6523-1.4766-7.0938-1.4688-4.8164-0.14453-9.4883 1.6719-12.945 5.0273-3.4609 3.3594-5.4102 7.9727-5.4102 12.793 0 4.8203 1.9492 9.4336 5.4102 12.793 3.457 3.3555 8.1289 5.1719 12.945 5.0273z" fill="${colors.primary}"/>
  <path d="m64.578 66.484c-0.19141 0.015625-0.38672 0.015625-0.57812 0-0.53516 0.011719-1.0664-0.082031-1.5625-0.28125h-0.09375l-14.062-5.9688c-0.18359-0.074219-0.35938-0.16406-0.53125-0.26562l-0.15625-0.10938c-0.20312-0.12891-0.39453-0.28125-0.5625-0.45312-0.17188-0.15625-0.32812-0.32812-0.46875-0.51562-0.33594-0.46875-0.57031-1-0.6875-1.5625-3.0156 2.375-6.8125 6.1875-6.8125 10.344 0 2.7188 1.5625 5.0625 4.8438 6.9375 2.875 1.8125 6.1836 2.8164 9.5781 2.9062 2.3672 0.035156 4.6875-0.63281 6.6719-1.9219 3.1367-2.1406 5.1328-5.5898 5.4219-9.375l-0.46875 0.15625c-0.17188 0.058594-0.35156 0.09375-0.53125 0.10938z" fill="${colors.primary}"/>
  <path d="m38.719 60.938h-6.5469c-0.86328 0-1.5625 0.69922-1.5625 1.5625v8.75c0 0.41406 0.16406 0.8125 0.45703 1.1055 0.29297 0.29297 0.69141 0.45703 1.1055 0.45703h5.7656c-0.61328-0.91797-1.0586-1.9414-1.3125-3.0156-0.16797-0.67969-0.25391-1.3789-0.25-2.0781 0.003906-1.2734 0.25391-2.5391 0.73438-3.7188 0.41016-1.082 0.94922-2.1133 1.6094-3.0625z" fill="${colors.primary}"/>
  <path d="m72.922 60.938h-3.7969c-0.34375 0.8125-0.64062 1.5625-0.90625 2.1094 0.015625 0.29688 0.015625 0.59375 0 0.89062 0.054688 1.9453-0.20312 3.8867-0.76562 5.75-0.30469 1.0859-0.73438 2.1367-1.2812 3.125h6.7031c0.41406 0 0.8125-0.16406 1.1055-0.45703s0.45703-0.69141 0.45703-1.1055v-8.75c0-0.84375-0.67188-1.5391-1.5156-1.5625z" fill="${colors.primary}"/>
  <path d="m79.156 76.781h8.6562c-0.13672-3.1172-1.2461-6.1133-3.1758-8.5664-1.9258-2.4531-4.5781-4.2383-7.5742-5.1055v8.1406c0 0.44531-0.074219 0.89062-0.21875 1.3125 1.3047 1.043 2.1367 2.5586 2.3125 4.2188z" fill="${colors.primary}"/>
  <path d="m76.328 79.422h14.359c0.82812 0 1.5 0.82812 1.5 1.5v9.2812c0 0.82812-0.67188 1.5-1.5 1.5h-14.359c-0.82812 0-1.5-0.82812-1.5-1.5v-9.2812c0-0.82812 0.67188-1.5 1.5-1.5z" fill="${colors.primary}"/>
  <path d="m28.031 66.297v-3.125c-2.9961 0.87109-5.6406 2.6562-7.5664 5.1094-1.9258 2.4531-3.0352 5.4453-3.168 8.5625h8.6406c0.17578-1.6602 1.0078-3.1758 2.3125-4.2188-0.14453-0.42188-0.21875-0.86719-0.21875-1.3125z" fill="${colors.primary}"/>
  <path d="m14.406 79.422h14.375c0.82812 0 1.5 0.82812 1.5 1.5v9.2812c0 0.82812-0.67188 1.5-1.5 1.5h-14.375c-0.82812 0-1.5-0.82812-1.5-1.5v-9.2812c0-0.82812 0.67188-1.5 1.5-1.5z" fill="${colors.primary}"/>
</svg>`;

function AuthScreen() {
  const {isLoggedIn} = useAuth();
  const navigation =
    useNavigation<NativeStackNavigationProp<AppStackParamList>>();

  // 카카오 로그인 훅 사용
  const {isLoading, showWebView, webViewUrl, handleKakaoLogin, closeWebView} =
    useKakaoLoginWithWebView();

  // 딥링크 처리 훅 사용
  useDeepLink({
    navigation,
    onLoginSuccess: closeWebView,
  });

  const handleEmailLogin = () => {
    // 간단한 이메일 로그인 (임시)
    Alert.prompt(
      '이메일 로그인',
      '이메일 주소를 입력하세요:',
      [
        {text: '취소', style: 'cancel'},
        {
          text: '로그인',
          onPress: async email => {
            if (email && email.includes('@')) {
              try {
                // 임시로 간단한 로그인 처리
                console.log('이메일 로그인:', email);
                Alert.alert('로그인 성공', `${email}으로 로그인되었습니다.`);
              } catch (error) {
                Alert.alert('오류', '로그인 중 오류가 발생했습니다.');
              }
            } else {
              Alert.alert('오류', '올바른 이메일 주소를 입력해주세요.');
            }
          },
        },
      ],
      'plain-text',
      '',
      'email-address',
    );
  };

  const handlePrivacyPolicy = () => {
    // TODO: 개인정보처리방침 링크
    console.log('개인정보처리방침');
  };

  const handleTermsOfService = () => {
    // TODO: 이용약관 링크
    console.log('이용약관');
  };

  useEffect(() => {
    if (isLoggedIn && navigation) {
      navigation.navigate('Tabs', {screen: 'Home'});
    }
  }, [isLoggedIn, navigation]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* 상단 로고 및 타이틀 */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <SvgXml xml={logoSvg} width="80" height="80" />
        </View>
        <Text style={styles.appTitle}>푸쉬핏</Text>
        <Text style={styles.appSubtitle}>
          얼굴인식으로 정확한 푸쉬업 카운트
        </Text>
      </View>

      {/* 메인 콘텐츠 */}
      <View style={styles.content}>
        <View style={styles.featuresContainer}>
          <View style={styles.featureItem}>
            <Fontawesome5
              name="user-circle"
              size={24}
              iconStyle="solid"
              color={colors.primary}
            />
            <Text style={styles.featureText}>얼굴인식 기반</Text>
          </View>
          <View style={styles.featureItem}>
            <Fontawesome5
              name="history"
              size={24}
              iconStyle="solid"
              color={colors.primary}
            />
            <Text style={styles.featureText}>푸쉬업 기록</Text>
          </View>
          <View style={styles.featureItem}>
            <Fontawesome5
              name="chart-bar"
              size={24}
              iconStyle="solid"
              color={colors.primary}
            />
            <Text style={styles.featureText}>통계 분석</Text>
          </View>
        </View>

        {/* 로그인 버튼들 */}
        <View style={styles.loginContainer}>
          <TouchableOpacity
            style={[styles.kakaoButton, isLoading && styles.disabledButton]}
            onPress={handleKakaoLogin}
            disabled={isLoading}>
            {isLoading ? (
              <ActivityIndicator size="small" color={colors.textBlack} />
            ) : (
              <Fontawesome5
                name="comment"
                size={20}
                iconStyle="solid"
                color="#000000"
                style={styles.kakaoIcon}
              />
            )}
            <Text style={styles.kakaoButtonText}>
              {isLoading ? '로그인 중...' : '카카오로 시작하기'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.emailButton}
            onPress={handleEmailLogin}>
            <Fontawesome5
              name="envelope"
              size={20}
              iconStyle="solid"
              color={colors.primary}
              style={styles.emailIcon}
            />
            <Text style={styles.emailButtonText}>이메일로 로그인</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 하단 정책 링크 */}
      <View style={styles.footer}>
        <View style={styles.policyContainer}>
          <TouchableOpacity onPress={handleTermsOfService}>
            <Text style={styles.policyText}>이용약관</Text>
          </TouchableOpacity>
          <Text style={styles.policySeparator}>|</Text>
          <TouchableOpacity onPress={handlePrivacyPolicy}>
            <Text style={styles.policyText}>개인정보처리방침</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.copyrightText}>
          © 2024 푸쉬핏. All rights reserved.
        </Text>
      </View>

      {/* 카카오 로그인 웹뷰 모달 */}
      <KakaoWebView
        visible={showWebView}
        url={webViewUrl}
        onClose={closeWebView}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 40,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.backgroundAccent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: colors.primary,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  appTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginVertical: 15,
  },
  appSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 30,
  },
  featuresContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 60,
  },
  featureItem: {
    alignItems: 'center',
    flex: 1,
  },
  featureText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  loginContainer: {
    gap: 16,
  },
  kakaoButton: {
    backgroundColor: colors.warning,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: colors.shadow,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  kakaoIcon: {
    marginRight: 12,
  },
  kakaoButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textBlack,
  },
  disabledButton: {
    opacity: 0.6,
  },
  loggedInContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 30,
  },
  logoutButton: {
    backgroundColor: colors.error,
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 12,
  },
  logoutButtonText: {
    color: colors.textLight,
    fontSize: 16,
    fontWeight: 'bold',
  },
  emailButton: {
    backgroundColor: colors.background,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray200,
    shadowColor: colors.shadow,
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  emailIcon: {
    marginRight: 12,
  },
  emailButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  signUpButton: {
    backgroundColor: colors.backgroundLight,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray200,
    alignItems: 'center',
  },
  signUpButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  footer: {
    paddingHorizontal: 30,
    paddingBottom: 30,
    alignItems: 'center',
  },
  policyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  policyText: {
    fontSize: 14,
    color: colors.primary,
    textDecorationLine: 'underline',
  },
  policySeparator: {
    fontSize: 14,
    color: colors.gray300,
    marginHorizontal: 12,
  },
  copyrightText: {
    fontSize: 12,
    color: colors.gray400,
  },
});

export default AuthScreen;
