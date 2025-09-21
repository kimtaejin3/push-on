import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import Home from '../screens/Home';
import Challenge from '../screens/Challenge';

const Tab = createBottomTabNavigator();

const BottomTabNavigation = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#3EB489',
        tabBarInactiveTintColor: '#242424',
        tabBarLabelStyle: {
          fontSize: 12,
        },
      }}>
      <Tab.Screen name="Home" component={Home} />
      <Tab.Screen name="Challenge" component={Challenge} />
    </Tab.Navigator>
  );
};

export default BottomTabNavigation;
