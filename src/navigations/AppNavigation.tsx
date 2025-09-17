import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {createStaticNavigation} from '@react-navigation/native';

import Home from '../screens/Home';
import Challenge from '../screens/Challenge';

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
    Home: {
      screen: Home,
    },
    Challenge: Challenge,
  },
});

const AppNavigation = createStaticNavigation(AppStack);

export type AppStackParamList = {
  Home: undefined;
  Challenge: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends AppStackParamList {}
  }
}

export default AppNavigation;
