import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/HomeScreen';
import ChallengeScreen from '../screens/Challenge';

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
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Challenge" component={ChallengeScreen} />
    </Tab.Navigator>
  );
};

export default BottomTabNavigation;
