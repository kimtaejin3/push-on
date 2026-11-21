import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import {TabBar} from '../components/ui/TabBar';
import HistoryScreen from '../screens/HistoryScreen';
import HomeScreen from '../screens/HomeScreen';
import ProgramScreen from '../screens/ProgramScreen';
import SettingScreen from '../screens/SettingScreen';
import {color} from '../theme';

export type BottomTabParamList = {
  Home: undefined;
  Program: {notice?: string} | undefined;
  History: undefined;
  Setting: undefined;
};

const Tab = createBottomTabNavigator<BottomTabParamList>();

const tabListeners = {
  tabPress: () =>
    ReactNativeHapticFeedback.trigger('impactLight', {
      enableVibrateFallback: true,
      ignoreAndroidSystemSettings: false,
    }),
};

const renderTabBar: React.ComponentProps<
  typeof Tab.Navigator
>['tabBar'] = props => <TabBar {...props} />;

const BottomTabNavigation = () => (
  <Tab.Navigator
    screenOptions={{
      headerShown: false,
      sceneStyle: {backgroundColor: color.bg},
    }}
    screenListeners={tabListeners}
    tabBar={renderTabBar}>
    <Tab.Screen name="Home" component={HomeScreen} />
    <Tab.Screen name="Program" component={ProgramScreen} />
    <Tab.Screen name="History" component={HistoryScreen} />
    <Tab.Screen name="Setting" component={SettingScreen} />
  </Tab.Navigator>
);

export default BottomTabNavigation;
