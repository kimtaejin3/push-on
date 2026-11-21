import React from 'react';
import {View, StyleSheet, ActivityIndicator} from 'react-native';
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
import ProgramScreen from '../screens/ProgramScreen';
import ProgramTableScreen from '../screens/ProgramTableScreen';
import StreakScreen from '../screens/StreakScreen';
import {WorkoutPlan} from '../domain/workoutSession';
import {useSession} from '../hooks/useSession';
import {colors} from '../constants/colors';
import Text from '../components/common/Text';
import CustomButton from '../components/common/CustomButton';
import StreakRuntime from '../components/features/streak/StreakRuntime';
import {useEnsureProfile} from '../hooks/useEnsureProfile';

const AppStack = createNativeStackNavigator({
  initialRouteName: 'Tabs',
  screenOptions: {
    headerTitleAlign: 'center',
    headerBackButtonDisplayMode: 'minimal',
    headerTintColor: 'black',
    contentStyle: {
      backgroundColor: 'white',
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
    Program: ProgramScreen,
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
  const {isLoggedIn, loading} = useSession();
  const {ready: profileReady, loading: profileLoading, retry: retryProfile} =
    useEnsureProfile();

  // 한 번 준비된 뒤에는 재확인이 있어도 네비게이터를 유지한다
  // (스플래시로 바뀌면 스택 전체가 언마운트되어 운동 중 화면이 날아간다)
  if ((loading || profileLoading) && !profileReady) {
    return (
      <View style={styles.splashContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>앱 데이터를 불러오고 있어요</Text>
      </View>
    );
  }

  if (!isLoggedIn) {
    return <AuthScreen />;
  }

  if (!profileReady) {
    // 프로필 자동 생성 실패 (네트워크 등). 온보딩 화면은 없어졌으므로 재시도만 제공한다
    return (
      <View style={styles.splashContainer}>
        <Text style={styles.loadingText}>프로필을 준비하지 못했어요</Text>
        <View style={styles.retryButton}>
          <CustomButton title="다시 시도" onPress={retryProfile} />
        </View>
      </View>
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
    backgroundColor: colors.backgroundDark,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textLight,
  },
  retryButton: {
    marginTop: 24,
    width: '60%',
  },
});

export type WorkoutSource = {kind: 'sets'} | {kind: 'program'; programId: string};

export type AppStackParamList = {
  Tabs: NavigatorScreenParams<BottomTabParamList>;
  Challenge: {purpose?: 'program-test'} | undefined;
  SetsSetup: undefined;
  Workout: {plan: WorkoutPlan; source: WorkoutSource};
  /** notice: 하향·주차 변경 직후 한 번 보여줄 안내 */
  Program: {notice?: string} | undefined;
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

export default ConditionalNavigation;
