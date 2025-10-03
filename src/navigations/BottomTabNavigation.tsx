import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/HomeScreen';
import Fontawesome5 from '@react-native-vector-icons/fontawesome5';
import Fontawesome6 from '@react-native-vector-icons/fontawesome6';
import StatisticScreen from '../screens/StatisticScreen';
import {colors} from '../constants/colors';

export type BottomTabParamList = {
  Home: undefined;
  Statistic: undefined;
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
        name="Statistic"
        component={StatisticScreen}
        options={{
          tabBarIcon: ({color}) => (
            <Fontawesome6
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
