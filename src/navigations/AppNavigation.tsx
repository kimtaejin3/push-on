import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {createStaticNavigation} from '@react-navigation/native';

import Challenge from '../screens/ChallengeScreen';
import BottomTabNavigation from './BottomTabNavigation';

const AppStack = createNativeStackNavigator({
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
    Challenge: Challenge,
  },
});

const AppNavigation = createStaticNavigation(AppStack);

export type AppStackParamList = {
  Tabs: undefined;
  Challenge: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends AppStackParamList {}
  }
}

export default AppNavigation;
