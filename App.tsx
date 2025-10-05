import {SafeAreaView, StyleSheet} from 'react-native';
import AppNavigation from './src/navigations/AppNavigation';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';

function App(): React.JSX.Element {
  const queryClient = new QueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaView style={styles.container}>
        <AppNavigation />
      </SafeAreaView>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;
