import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Fontawesome5 from '@react-native-vector-icons/fontawesome5';
import {colors} from '../constants/colors';
import {useDeepLink} from '../hooks/useDeepLink';
import KakaoWebView from '../components/features/webview/KakaoWebView';
import {useKakaoLoginWithWebView} from '../hooks/useKakaoLogin';
import {useGoogleLogin} from '../hooks/useGoogleLogin';
import Logo from '../assets/svgs/logo.svg';

function AuthScreen() {
  // 카카오 로그인 훅 사용
  const {isLoading, showWebView, webViewUrl, handleKakaoLogin, closeWebView} =
    useKakaoLoginWithWebView();

  // 구글 로그인 훅 사용
  const {signInWithGoogle, isLoading: isGoogleLoading} = useGoogleLogin();

  // 딥링크 처리 훅 사용
  useDeepLink({
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

  return (
    <SafeAreaView style={styles.container}>
      {/* 상단 로고 및 타이틀 */}
      <View style={styles.header}>
        <Logo width={80} height={80} fill={colors.primary} />
        <Text style={styles.appTitle}>PushOn</Text>
        <Text style={styles.appSubtitle}>푸쉬업은 PushOn과 함께,</Text>
        <Text style={styles.appSubtitle}>
          아래의 기능들을 무료로 이용하세요!
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
            style={[
              styles.googleButton,
              isGoogleLoading && styles.disabledButton,
            ]}
            onPress={signInWithGoogle}
            disabled={isGoogleLoading}>
            {isGoogleLoading ? (
              <ActivityIndicator size="small" color={colors.textLight} />
            ) : (
              <Fontawesome5
                name="google"
                size={20}
                iconStyle="brand"
                color={colors.textLight}
                style={styles.googleIcon}
              />
            )}
            <Text style={styles.googleButtonText}>
              {isGoogleLoading ? '로그인 중...' : 'Google로 시작하기'}
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
          <Text style={styles.smallText}>
            가입 시 이용약관 및 개인정보처리방침에 동의합니다
          </Text>
        </View>
        <Text style={styles.copyrightText}>
          © 2025 PushOn. All rights reserved.
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
    backgroundColor: colors.backgroundDark,
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
    color: colors.textLight,
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
    marginTop: 20,
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
  googleButton: {
    backgroundColor: '#4285F4',
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
  googleIcon: {
    marginRight: 12,
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textLight,
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
    backgroundColor: colors.overlayMedium,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary,
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
    color: colors.textLight,
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
  smallText: {
    fontSize: 12,
    color: colors.gray400,
    textAlign: 'center',
    lineHeight: 16,
  },
  copyrightText: {
    fontSize: 12,
    color: colors.gray400,
  },
});

export default AuthScreen;
