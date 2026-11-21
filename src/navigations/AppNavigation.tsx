import React from 'react';
import {ScrollView, StatusBar, StyleSheet, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {
  createStaticNavigation,
  NavigatorScreenParams,
} from '@react-navigation/native';
import ChallengeScreen from '../screens/ChallengeScreen';
import BottomTabNavigation, {BottomTabParamList} from './BottomTabNavigation';
import SettingScreen from '../screens/SettingScreen';
import AuthScreen from '../screens/AuthScreen';
import TermsOfServiceScreen from '../screens/TermsOfServiceScreen';
import PrivacyPolicyScreen from '../screens/PrivacyPolicyScreen';
import LeaderboardScreen from '../screens/LeaderboardScreen';
import AccountSettingsScreen from '../screens/AccountSettingsScreen';
import ProfileEditScreen from '../screens/ProfileEditScreen';
import SetsSetupScreen from '../screens/SetsSetupScreen';
import WorkoutScreen from '../screens/WorkoutScreen';
import ProgramTableScreen from '../screens/ProgramTableScreen';
import StreakScreen from '../screens/StreakScreen';
import {WorkoutPlan} from '../domain/workoutSession';
import {useSession} from '../hooks/useSession';
import {Button} from '../components/ui/Button';
import {Icon} from '../components/ui/Icon';
import {Text} from '../components/ui/Text';
import {color, radius, space} from '../theme';
import StreakRuntime from '../components/features/streak/StreakRuntime';
import {useEnsureProfile} from '../hooks/useEnsureProfile';

const AppStack = createNativeStackNavigator({
  initialRouteName: 'Tabs',
  screenOptions: {
    headerTitleAlign: 'center',
    headerBackButtonDisplayMode: 'minimal',
    headerTintColor: color.text,
    contentStyle: {
      backgroundColor: color.bg,
    },
    headerShown: false,
  },
  screens: {
    Tabs: {
      screen: BottomTabNavigation,
    },
    Challenge: ChallengeScreen,
    SetsSetup: SetsSetupScreen,
    Workout: WorkoutScreen,
    ProgramTable: ProgramTableScreen,
    Streak: StreakScreen,
    Setting: SettingScreen,
    TermsOfService: TermsOfServiceScreen,
    PrivacyPolicy: PrivacyPolicyScreen,
    Leaderboard: LeaderboardScreen,
    AccountSettings: AccountSettingsScreen,
    ProfileEdit: ProfileEditScreen,
  },
});

const AppNavigation = createStaticNavigation(AppStack);

// 조건부 네비게이션 컴포넌트
const ConditionalNavigation = () => {
  const {bottom} = useSafeAreaInsets();
  const {isLoggedIn, loading} = useSession();
  const {
    ready: profileReady,
    loading: profileLoading,
    retry: retryProfile,
  } = useEnsureProfile();

  // 한 번 준비된 뒤에는 재확인이 있어도 네비게이터를 유지한다
  // (스플래시로 바뀌면 스택 전체가 언마운트되어 운동 중 화면이 날아간다)
  if ((loading || profileLoading) && !profileReady) {
    return (
      <View style={styles.splashContainer}>
        <View style={styles.brand}>
          <Text weight={800} style={styles.wordmark}>
            PUSH{' '}
            <Text color="active" weight={800} style={styles.wordmark}>
              ON
            </Text>
          </Text>
          <Text variant="label" color="textMuted">
            바닥에 폰 하나, 개수는 앱이 세요
          </Text>
        </View>
        <View
          style={[styles.loading, {bottom: bottom + space[48]}]}
          accessibilityRole="progressbar">
          <View style={styles.loadingTrack}>
            <View style={styles.loadingIndicator} />
          </View>
          <Text variant="caption" color="textMuted">
            앱 데이터를 불러오고 있어요
          </Text>
        </View>
      </View>
    );
  }

  if (!isLoggedIn) {
    return <AuthScreen />;
  }

  if (!profileReady) {
    // 프로필 자동 생성 실패 (네트워크 등). 온보딩 화면은 없어졌으므로 재시도만 제공한다
    return (
      <ScrollView
        style={styles.profileError}
        contentContainerStyle={styles.profileErrorContent}>
        <View style={styles.profileErrorIcon}>
          <Icon name="user-round-x" size={32} color="alert" />
        </View>
        <Text weight={800} style={styles.profileErrorTitle}>
          프로필을 준비하지 못했어요
        </Text>
        <Text variant="label" color="textMuted" style={styles.profileErrorBody}>
          인터넷 연결을 확인하고 다시 시도해 주세요.{'\n'}로그인은 그대로
          유지돼요.
        </Text>
        <View style={styles.retryButton}>
          <Button
            variant="primary"
            title="다시 시도"
            icon="rotate-cw"
            onPress={retryProfile}
          />
        </View>
      </ScrollView>
    );
  }

  // 보관 중인 운동 재전송은 로그인된 동안에만 돈다
  return (
    <>
      <AppNavigation />
      <StreakRuntime />
    </>
  );
};

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: color.bg,
  },
  brand: {alignItems: 'center', gap: space[8], paddingHorizontal: space[24]},
  wordmark: {fontSize: 52, lineHeight: 64, textAlign: 'center'},
  loading: {position: 'absolute', alignItems: 'center', gap: space[12]},
  loadingTrack: {
    width: 160,
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: color.surface2,
  },
  loadingIndicator: {
    width: '45%',
    height: '100%',
    borderRadius: radius.pill,
    backgroundColor: color.active,
  },
  profileError: {flex: 1, backgroundColor: color.bg},
  profileErrorContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: space[24],
  },
  profileErrorIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: color.alert + '24',
    marginBottom: space[20],
  },
  profileErrorTitle: {fontSize: 20, lineHeight: 28, textAlign: 'center'},
  profileErrorBody: {textAlign: 'center', marginTop: space[8]},
  retryButton: {width: '100%', maxWidth: 329, marginTop: space[20]},
});

export type WorkoutSource =
  | {kind: 'sets'}
  | {kind: 'program'; programId: string};

export type AppStackParamList = {
  Tabs: NavigatorScreenParams<BottomTabParamList>;
  Challenge: {purpose?: 'program-test'} | undefined;
  SetsSetup: undefined;
  Workout: {plan: WorkoutPlan; source: WorkoutSource};
  ProgramTable: undefined;
  Streak: undefined;
  Setting: undefined;
  TermsOfService: undefined;
  PrivacyPolicy: undefined;
  Leaderboard: undefined;
  AccountSettings: undefined;
  ProfileEdit: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends AppStackParamList {}
  }
}

export default function RootNavigation() {
  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={color.bg} />
      <ConditionalNavigation />
    </>
  );
}
