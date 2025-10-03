import {SafeAreaView, StyleSheet} from 'react-native';
import AppNavigation from './src/navigations/AppNavigation';
import AuthScreen from './src/screens/AuthScreen';

function App(): React.JSX.Element {
  return (
    <SafeAreaView style={styles.container}>
      <AppNavigation />
      {/* <AuthScreen /> */}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;
