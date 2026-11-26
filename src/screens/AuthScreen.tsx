import React, {useRef, useState} from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {CircleAlert, Info} from 'lucide-react-native';
// 소셜 로그인 로고는 각 사의 브랜드 정책 때문에 디자인 시안 대신 기존 로고를 쓴다
// (apple.svg·kakao.svg 는 Font Awesome Free 5 아이콘, CC BY 4.0)
import AppleLogo from '../assets/svgs/apple.svg';
import KakaoLogo from '../assets/svgs/kakao.svg';
import GoogleLogo from '../assets/svgs/google.svg';
import {Text} from '../components/ui/Text';
import {Button} from '../components/ui/Button';
import {ScreenHeader} from '../components/ui/ScreenHeader';
import {ConfirmDialog} from '../components/ui/feedback/ConfirmDialog';
import {useToast} from '../components/ui/feedback/ToastProvider';
import {useAuth, type SignInResult} from '../hooks/useAuth';
import {color, layout, radius, space} from '../theme';
import type {Provider} from '../types/auth';

const buttons = [
  {
    provider: 'apple',
    name: 'Apple',
    title: 'Apple로 계속하기',
    logo: AppleLogo,
    logoColor: '#000000',
  },
  {
    provider: 'kakao',
    name: '카카오',
    title: '카카오로 시작하기',
    logo: KakaoLogo,
    logoColor: '#000000',
  },
  {
    provider: 'google',
    name: 'Google',
    title: 'Google로 시작하기',
    logo: GoogleLogo,
    logoColor: undefined,
  },
] as const;

interface AuthScreenProps {
  /** 게스트 계정을 못 만들어 이 화면이 앱 첫 화면으로 뜬 경우(오프라인 등) 다시 시도 */
  onRetryGuest?: () => void;
  /** 설정에서 연 '로그인' 화면일 때 내비게이션 (스택 화면으로 쓰일 때만 들어온다) */
  navigation?: {goBack: () => void; canGoBack: () => boolean};
}

/**
 * 로그인 화면. 두 가지로 쓰인다.
 * - 스택의 'Login' 화면: 게스트가 Apple·카카오·Google 을 연결해 기록을 계정에 보관한다.
 * - 앱 첫 화면: 게스트 계정을 만들지 못했을 때(오프라인) 다시 시도하거나 바로 로그인한다.
 */
export default function AuthScreen({onRetryGuest, navigation}: AuthScreenProps) {
  const {signInWithProvider, isLoading} = useAuth();
  const toast = useToast();
  const [activeProvider, setActiveProvider] = useState<Provider | null>(null);
  const [hasError, setHasError] = useState(false);
  const [googleUnavailable, setGoogleUnavailable] = useState(false);
  // 연결하려던 소셜 계정이 이미 다른 계정에 쓰이는 경우의 이어서 로그인
  const [exists, setExists] = useState<Extract<SignInResult, {status: 'exists'}> | null>(null);
  const signingIn = useRef(false);
  const isRoute = navigation !== undefined;

  const finish = () => {
    if (navigation?.canGoBack()) {
      navigation.goBack();
      toast.show('로그인했어요. 이제 기록이 계정에 안전하게 보관돼요');
    }
  };

  const handleSignIn = async (provider: Provider) => {
    if (signingIn.current) {
      return;
    }
    signingIn.current = true;
    setActiveProvider(provider);
    setHasError(false);

    try {
      const result = await signInWithProvider(provider);
      if (result.status === 'success') {
        finish();
      } else if (result.status === 'exists') {
        setExists(result);
      } else if (result.status === 'failed') {
        if (result.reason === 'play-services-unavailable') {
          setGoogleUnavailable(true);
        } else {
          setHasError(true);
        }
      }
    } finally {
      signingIn.current = false;
      setActiveProvider(null);
    }
  };

  const continueWithExisting = async () => {
    const pending = exists;
    setExists(null);
    if (!pending) {
      return;
    }
    try {
      await pending.continueSignIn();
      finish();
    } catch (error) {
      console.error('기존 계정 로그인 실패:', error);
      setHasError(true);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      {isRoute && <ScreenHeader title="로그인" onBack={() => navigation.goBack()} />}
      <ScrollView contentContainerStyle={styles.content}>
        {isRoute ? (
          <View style={styles.hero}>
            <Text variant="title">로그인하고 기록 보관하기</Text>
            <Text variant="label" weight={500} color="textMuted" style={styles.subtitle}>
              지금까지의 운동 기록이 그대로 계정에 이어져요.{'\n'}앱을 지우거나 폰을
              바꿔도 로그인하면 다시 볼 수 있어요.
            </Text>
          </View>
        ) : (
        <View style={styles.hero}>
          <View style={styles.wordmark} accessibilityLabel="PushOn" accessible>
            <Text numeric weight={800} style={styles.brand}>
              PUSH
            </Text>
            <Text numeric weight={800} color="active" style={styles.brand}>
              ON
            </Text>
          </View>
          <Text numeric weight={900} color="active" style={styles.heroNumber}>
            100
          </Text>
          <Text variant="title">6주 뒤, 쉬지 않고 100개</Text>
          <Text
            variant="label"
            weight={500}
            color="textMuted"
            style={styles.subtitle}>
            PT 받으러 헬스장 가기 전에,{'\n'}
            100개 먼저 만들고 가세요.
          </Text>
          {onRetryGuest && (
            <View style={styles.guest}>
              <Text variant="label" color="textMuted">
                인터넷 연결을 확인한 뒤 로그인 없이 시작할 수 있어요
              </Text>
              <Button variant="secondary" title="로그인 없이 시작하기" onPress={onRetryGuest} />
            </View>
          )}
        </View>
        )}

        <View style={styles.buttons}>
          {googleUnavailable && (
            <View
              accessibilityRole="alert"
              style={[styles.notice, styles.warning]}>
              <Info size={16} color={color.record} accessible={false} />
              <Text variant="caption" style={styles.noticeText}>
                이 기기에서는 Google 로그인을 쓸 수 없어요. 카카오로 시작해
                주세요
              </Text>
            </View>
          )}
          {hasError && (
            <View
              accessibilityRole="alert"
              style={[styles.notice, styles.error]}>
              <CircleAlert size={16} color={color.alert} accessible={false} />
              <Text variant="caption" style={styles.noticeText}>
                로그인하지 못했어요. 잠시 뒤 다시 시도해 주세요
              </Text>
            </View>
          )}
          {buttons.map(({provider, name, title, logo: Logo, logoColor}) => {
            if (provider === 'apple' && Platform.OS !== 'ios') {
              return null;
            }
            const busy = provider === activeProvider;
            const disabled =
              activeProvider !== null ||
              isLoading ||
              (provider === 'google' && googleUnavailable);
            const tint = provider === 'google' ? 'text' : 'onAccent';

            return (
              <Pressable
                key={provider}
                accessibilityRole="button"
                accessibilityState={{disabled, busy}}
                disabled={disabled}
                onPress={() => handleSignIn(provider)}
                style={({pressed}) => [
                  styles.button,
                  styles[provider],
                  (pressed || (disabled && !busy)) && styles.dimmed,
                ]}>
                {busy ? (
                  <ActivityIndicator size="small" color={color[tint]} />
                ) : (
                  <Logo width={20} height={20} color={logoColor} />
                )}
                <Text color={tint} weight={700}>
                  {busy ? `${name}로 로그인 중…` : title}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.footer}>
          <Text variant="caption" color="textMuted">
            계속하면 아래 내용에 동의하게 돼요
          </Text>
          <Text variant="caption" weight={600}>
            이용약관 · 개인정보 처리방침
          </Text>
        </View>
      </ScrollView>
      <ConfirmDialog
        visible={exists !== null}
        title="이미 가입된 계정이에요"
        message="그 계정으로 로그인하면 지금 기록은 이 계정에 남고, 그 계정의 기록이 보여요."
        confirmLabel="그 계정으로 로그인"
        onConfirm={continueWithExisting}
        onCancel={() => setExists(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: color.bg},
  content: {
    flexGrow: 1,
    paddingHorizontal: layout.screenPadding,
    paddingVertical: space[12],
    gap: space[20],
  },
  hero: {flexGrow: 1, justifyContent: 'center', paddingVertical: space[16]},
  wordmark: {flexDirection: 'row', alignItems: 'center', gap: space[8]},
  brand: {fontSize: 28, lineHeight: 34},
  heroNumber: {fontSize: 168, lineHeight: 174},
  subtitle: {marginTop: space[12], lineHeight: 22},
  guest: {marginTop: space[24], gap: space[12]},
  buttons: {gap: 10},
  button: {
    minHeight: layout.primaryButtonHeight,
    paddingHorizontal: space[12],
    paddingVertical: space[8],
    borderRadius: radius.m,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space[8],
  },
  apple: {backgroundColor: color.onBrand},
  kakao: {backgroundColor: '#FEE500'},
  google: {
    backgroundColor: color.surface2,
    borderColor: color.border,
    borderWidth: 1,
  },
  dimmed: {opacity: 0.4},
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[8],
    borderRadius: radius.m,
    padding: space[12],
  },
  noticeText: {flex: 1},
  warning: {backgroundColor: `${color.record}1F`},
  error: {backgroundColor: `${color.alert}1F`},
  footer: {alignItems: 'center', gap: space[4]},
});
