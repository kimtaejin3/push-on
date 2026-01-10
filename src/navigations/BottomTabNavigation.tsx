import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/HomeScreen';
import LeaderboardScreen from '../screens/LeaderboardScreen';
import Fontawesome5 from '@react-native-vector-icons/fontawesome5';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import {colors} from '../constants/colors';
import HistoryScreen from '../screens/HistoryScreen';
import StatisticScreen from '../screens/StatisticScreen';
import SettingScreen from '../screens/SettingScreen';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';

export type BottomTabParamList = {
  Home: undefined;
  Leaderboard: undefined;
  Statistic: undefined;
  History: undefined;
  Setting: undefined;
};

const Tab = createBottomTabNavigator<BottomTabParamList>();

// TODO: 필요없는 Wrapper들 제거필요.
const HomeIcon = ({color}: {color: string}) => (
  <Fontawesome5 name="home" size={20} color={color} iconStyle="solid" />
);
const HistoryIcon = ({color}: {color: string}) => (
  <Fontawesome5 name="history" size={20} color={color} iconStyle="solid" />
);
const StatisticIcon = ({color}: {color: string}) => (
  <FontAwesome6 name="chart-simple" size={20} color={color} iconStyle="solid" />
);
const SettingIcon = ({color}: {color: string}) => (
  <Fontawesome5 name="cog" size={20} color={color} iconStyle="solid" />
);
const MedalIcon = ({color}: {color: string}) => (
  <Fontawesome5 name="medal" size={20} color={color} iconStyle="solid" />
);
const homeTabBarIcon = ({color}: {color: string}) => <HomeIcon color={color} />;
const historyTabBarIcon = ({color}: {color: string}) => (
  <HistoryIcon color={color} />
);
const statisticTabBarIcon = ({color}: {color: string}) => (
  <StatisticIcon color={color} />
);
const settingTabBarIcon = ({color}: {color: string}) => (
  <SettingIcon color={color} />
);
const medalTabBarIcon = ({color}:{color: string}) => (
  <MedalIcon color={color}/>
);

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
          tabBarIcon: homeTabBarIcon,
        }}
        listeners={{
          tabPress: handleTabPress,
        }}
      />
      <Tab.Screen
        name="Leaderboard"
        component={LeaderboardScreen}
        options={{
          tabBarIcon: medalTabBarIcon,
        }}
        listeners={{
          tabPress: handleTabPress,
        }}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{
          tabBarIcon: historyTabBarIcon,
        }}
        listeners={{
          tabPress: handleTabPress,
        }}
      />
      <Tab.Screen
        name="Statistic"
        component={StatisticScreen}
        options={{
          tabBarIcon: statisticTabBarIcon,
        }}
        listeners={{
          tabPress: handleTabPress,
        }}
      />
      <Tab.Screen
        name="Setting"
        component={SettingScreen}
        options={{
          tabBarIcon: settingTabBarIcon,
        }}
        listeners={{
          tabPress: handleTabPress,
        }}
      />
    </Tab.Navigator>
  );
};

export default BottomTabNavigation;
