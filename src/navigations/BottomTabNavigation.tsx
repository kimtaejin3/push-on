import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/HomeScreen';
import Fontawesome5 from '@react-native-vector-icons/fontawesome5';
import {colors} from '../constants/colors';
import HistoryScreen from '../screens/HistoryScreen';
import StatisticScreen from '../screens/StatisticScreen';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import SettingScreen from '../screens/SettingScreen';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';

export type BottomTabParamList = {
  Home: undefined;
  Statistic: undefined;
  History: undefined;
  Setting: undefined;
};

const Tab = createBottomTabNavigator<BottomTabParamList>();

const BottomTabNavigation = () => {
  const handleTabPress = () => {
    // 탭 이동 시 가벼운 진동
    ReactNativeHapticFeedback.trigger('impactLight', {
      enableVibrateFallback: true,
      ignoreAndroidSystemSettings: false,
    });
  };

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#7D5FFF',
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarShowLabel: false, // This is the correct property to hide labels
        tabBarStyle: {
          backgroundColor: '#000',
          paddingTop: 10,
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
          borderRadius: 100,
          position: 'absolute',
          bottom: 0,
        },
      }}>
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({color}) => (
            <Fontawesome5
              name="home"
              size={20}
              color={color}
              iconStyle="solid"
            />
          ),
        }}
        listeners={{
          tabPress: handleTabPress,
        }}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{
          tabBarIcon: ({color}) => (
            <Fontawesome5
              name="history"
              size={20}
              color={color}
              iconStyle="solid"
            />
          ),
        }}
        listeners={{
          tabPress: handleTabPress,
        }}
      />
      <Tab.Screen
        name="Statistic"
        component={StatisticScreen}
        options={{
          tabBarIcon: ({color}) => (
            <FontAwesome6
              name="chart-simple"
              size={20}
              color={color}
              iconStyle="solid"
            />
          ),
        }}
        listeners={{
          tabPress: handleTabPress,
        }}
      />
      <Tab.Screen
        name="Setting"
        component={SettingScreen}
        options={{
          tabBarIcon: ({color}) => (
            <Fontawesome5
              name="cog"
              size={20}
              color={color}
              iconStyle="solid"
            />
          ),
        }}
        listeners={{
          tabPress: handleTabPress,
        }}
      />
    </Tab.Navigator>
  );
};

export default BottomTabNavigation;
