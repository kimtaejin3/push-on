import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/HomeScreen';
import Fontawesome5 from '@react-native-vector-icons/fontawesome5';
import {colors} from '../constants/colors';
import HistoryScreen from '../screens/HistoryScreen';
import StatisticScreen from '../screens/StatisticScreen';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';

export type BottomTabParamList = {
  Home: undefined;
  Statistic: undefined;
  History: undefined;
};

const Tab = createBottomTabNavigator<BottomTabParamList>();

const BottomTabNavigation = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarLabelStyle: {
          fontSize: 12,
        },
        tabBarShowLabel: false, // This is the correct property to hide labels
        tabBarStyle: {
          paddingTop: 10,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
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
      />
    </Tab.Navigator>
  );
};

export default BottomTabNavigation;
