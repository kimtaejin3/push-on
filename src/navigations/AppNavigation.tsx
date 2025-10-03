import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {
  createStaticNavigation,
  NavigatorScreenParams,
} from '@react-navigation/native';

import ChallengeScreen from '../screens/ChallengeScreen';
import BottomTabNavigation, {BottomTabParamList} from './BottomTabNavigation';
import AuthScreen from '../screens/AuthScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import SettingScreen from '../screens/SettingScreen';
import {useAuth} from '../hooks/useAuth';

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
    Onboarding: OnboardingScreen,
    Setting: SettingScreen,
  },
});

const AppNavigation = createStaticNavigation(AppStack);

// 조건부 네비게이션 컴포넌트
const ConditionalNavigation = () => {
  const {isLoggedIn, loading} = useAuth();

  // 로딩 중일 때는 아무것도 렌더링하지 않음
  if (loading) {
    return null;
  }

  // 로그인되지 않은 경우 AuthScreen 표시
  if (!isLoggedIn) {
    return <AuthScreen />;
  }

  // 로그인된 경우 메인 네비게이션 표시
  return <AppNavigation />;
};

export type AppStackParamList = {
  Tabs: NavigatorScreenParams<BottomTabParamList>;
  Challenge: undefined;
  Onboarding: undefined;
  Setting: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends AppStackParamList {}
  }
}

export default ConditionalNavigation;
