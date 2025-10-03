import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {
  createStaticNavigation,
  NavigatorScreenParams,
} from '@react-navigation/native';

import Challenge from '../screens/ChallengeScreen';
import BottomTabNavigation, {BottomTabParamList} from './BottomTabNavigation';
import AuthScreen from '../screens/AuthScreen';

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
    Challenge: Challenge,
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
