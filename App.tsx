import React, {useEffect} from 'react';
import AppNavigation from './src/navigations/AppNavigation';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {GoogleSignin} from '@react-native-google-signin/google-signin';
import {SafeAreaProvider} from 'react-native-safe-area-context';

export const queryClient = new QueryClient();

function App(): React.JSX.Element {
  useEffect(() => {
    // Google Sign-In 설정
    try {
      GoogleSignin.configure({
        webClientId:
          '1067672951501-t1ta5taht07g9lho68dnq9pp4dor48do.apps.googleusercontent.com',
        iosClientId:
          '1067672951501-p2u9lijpokvakth3ked1mvqq6vo491lq.apps.googleusercontent.com',
        scopes: ['profile', 'email'],
      });
    } catch (error) {
      console.error('[App.tsx] SDK 초기화 에러:', error);
    }
  }, []);

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AppNavigation />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

export default App;
