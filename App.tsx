import {SafeAreaView, StyleSheet} from 'react-native';
import AppNavigation from './src/navigations/AppNavigation';
import OnboardingScreen from './src/screens/OnboardingScreen';

function App(): React.JSX.Element {
  return (
    <SafeAreaView style={styles.container}>
      {/* <AppNavigation /> */}
      <OnboardingScreen />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;
