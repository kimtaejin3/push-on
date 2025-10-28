import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {
  createStaticNavigation,
  NavigatorScreenParams,
} from '@react-navigation/native';
import ChallengeScreen from '../screens/ChallengeScreen';
import BottomTabNavigation, {BottomTabParamList} from './BottomTabNavigation';
import SettingScreen from '../screens/SettingScreen';
import AuthScreen from '../screens/AuthScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import AppInfoScreen from '../screens/AppInfoScreen';
import TermsOfServiceScreen from '../screens/TermsOfServiceScreen';
import PrivacyPolicyScreen from '../screens/PrivacyPolicyScreen';
import LeaderboardScreen from '../screens/LeaderboardScreen';
import AccountSettingsScreen from '../screens/AccountSettingsScreen';
import ProfileEditScreen from '../screens/ProfileEditScreen';
import {useAuth} from '../hooks/useAuth';
import {useIsOnboarded} from '../hooks/useIsOnboarded';

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
    AppInfo: AppInfoScreen,
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
  const {isLoggedIn, loading: authLoading} = useAuth();
  const {
    isOnboarded,
    loading: onboardingLoading,
    refresh: refreshOnboarding,
  } = useIsOnboarded();
  if (authLoading || onboardingLoading) {
    return null;
  }
  if (!isLoggedIn) {
    return <AuthScreen />;
  }
  if (isOnboarded === false) {
    return <OnboardingScreen onComplete={refreshOnboarding} />;
  }
  return <AppNavigation />;
};

export type AppStackParamList = {
  Tabs: NavigatorScreenParams<BottomTabParamList>;
  Challenge: undefined;
  Onboarding: undefined;
  Setting: undefined;
  AppInfo: undefined;
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
