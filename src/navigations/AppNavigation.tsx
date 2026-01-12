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
import {useSession} from '../hooks/useSession';
import {colors} from '../constants/colors';
import Text from '../components/common/Text';
import OnboardingScreen from '../screens/OnboardingScreen';
import { useIsOnboarded } from '../hooks/useIsOnboarded';

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
  const {isOnboarded, loading: onboardingLoading, refresh: refreshOnboardingStatus} = useIsOnboarded();

  if (loading || onboardingLoading) {
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

  //TODO: UX 개선하기: 이게 가끔 보여지는 경우가 있음.
  if (!isOnboarded) {
    return <OnboardingScreen onComplete={() => {
      refreshOnboardingStatus();
    }} />;
  }

  return <AppNavigation />;
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
});

export type AppStackParamList = {
  Tabs: NavigatorScreenParams<BottomTabParamList>;
  Challenge: undefined;
  Onboarding: undefined;
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
