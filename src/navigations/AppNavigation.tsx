import React, {useState} from 'react';
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
  },
});

const AppNavigation = createStaticNavigation(AppStack);

// 조건부 네비게이션 컴포넌트
const ConditionalNavigation = () => {
  const {isLoggedIn, loading: authLoading} = useAuth();
  const {isOnboarded, loading: onboardingLoading} = useIsOnboarded();

  const [_, setRerender] = useState(false);

  // 로딩 중일 때는 아무것도 렌더링하지 않음
  if (authLoading || onboardingLoading) {
    return null;
  }

  // 로그인되지 않은 경우 AuthScreen 표시
  if (!isLoggedIn) {
    return <AuthScreen />;
  }

  // 로그인되었지만 온보딩이 필요한 경우 OnboardingScreen 표시
  if (isOnboarded === false) {
    return <OnboardingScreen onComplete={() => setRerender(true)} />;
  }

  // 로그인되고 온보딩도 완료된 경우 메인 네비게이션 표시
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
