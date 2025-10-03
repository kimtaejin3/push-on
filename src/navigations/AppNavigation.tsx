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

const AppStack = createNativeStackNavigator({
  initialRouteName: 'Auth',
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
    Auth: AuthScreen,
    Tabs: {
      screen: BottomTabNavigation,
    },
    Challenge: ChallengeScreen,
    Onboarding: OnboardingScreen,
    Setting: SettingScreen,
  },
});

const AppNavigation = createStaticNavigation(AppStack);

export type AppStackParamList = {
  Tabs: NavigatorScreenParams<BottomTabParamList>;
  Challenge: undefined;
  Auth: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends AppStackParamList {}
  }
}

export default AppNavigation;
