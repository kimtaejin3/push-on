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
import {Apple, CircleAlert, Info, MessageCircle} from 'lucide-react-native';
import {Text} from '../components/ui/Text';
import {useAuth} from '../hooks/useAuth';
import {color, layout, radius, space} from '../theme';
import type {Provider} from '../types/auth';

const buttons = [
  {provider: 'apple', name: 'Apple', title: 'Apple로 계속하기', icon: Apple},
  {
    provider: 'kakao',
    name: '카카오',
    title: '카카오로 시작하기',
    icon: MessageCircle,
  },
  {provider: 'google', name: 'Google', title: 'Google로 시작하기', icon: null},
] as const;

export default function AuthScreen() {
  const {signInWithProvider, isLoading} = useAuth();
  const [activeProvider, setActiveProvider] = useState<Provider | null>(null);
  const [hasError, setHasError] = useState(false);
  const [googleUnavailable, setGoogleUnavailable] = useState(false);
  const signingIn = useRef(false);

  const handleSignIn = async (provider: Provider) => {
    if (signingIn.current) {
      return;
    }
    signingIn.current = true;
    setActiveProvider(provider);
    setHasError(false);

    try {
      const result = await signInWithProvider(provider);
      if (result.status === 'failed') {
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

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
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
            폰을 바닥에 두면 얼굴로 개수를 세요.{'\n'}
            기록은 계정에 안전하게 남아요.
          </Text>
        </View>

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
          {buttons.map(({provider, name, title, icon: Glyph}) => {
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
                ) : Glyph ? (
                  <Glyph size={18} color={color[tint]} accessible={false} />
                ) : (
                  <Text color={tint} weight={800}>
                    G
                  </Text>
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
