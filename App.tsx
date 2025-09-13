import {SafeAreaView, StyleSheet} from 'react-native';
import AppNavigation from './src/navigations/AppNavigation';

function App(): React.JSX.Element {
  return (
    <SafeAreaView style={styles.container}>
      {/* <Challenge /> */}
      <AppNavigation />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;
