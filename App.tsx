/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, {useEffect, useState} from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  NativeModules,
  useColorScheme,
} from 'react-native';

import {Colors} from 'react-native/Libraries/NewAppScreen';

const {PushupManager} = NativeModules;

function App(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';
  const [count, setCount] = useState(0);
  const [isTracking, setIsTracking] = useState(false);

  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
    flex: 1,
  };

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isTracking) {
      // Start tracking pushups
      console.log('Start tracking pushups');
      console.log(PushupManager);
      PushupManager.startPushupSession();

      // Update count every 500ms
      interval = setInterval(async () => {
        try {
          const currentCount = await PushupManager.getPushupCount();
          setCount(currentCount);
        } catch (error) {
          console.error('Failed to get pushup count:', error);
        }
      }, 500);
    } else if (interval) {
      // Stop tracking
      clearInterval(interval);
      PushupManager.stopPushupSession();
    }

    // Cleanup on unmount
    return () => {
      if (interval) {
        clearInterval(interval);
      }
      PushupManager.stopPushupSession();
    };
  }, [isTracking]);

  const toggleTracking = () => {
    setIsTracking(prev => !prev);
    if (isTracking) {
      // Reset count when stopping
      setCount(0);
    }
  };

  return (
    <SafeAreaView style={backgroundStyle}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={backgroundStyle.backgroundColor}
      />
      <View style={styles.container}>
        <Text style={styles.title}>푸쉬업 카운터</Text>

        <View style={styles.countContainer}>
          <Text style={styles.countText}>{count}</Text>
          <Text style={styles.countLabel}>개</Text>
        </View>

        <TouchableOpacity
          style={[
            styles.button,
            isTracking ? styles.stopButton : styles.startButton,
          ]}
          onPress={toggleTracking}>
          <Text style={styles.buttonText}>
            {isTracking ? '중지하기' : '시작하기'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.instructionText}>
          {isTracking
            ? '카메라를 얼굴에 향하고 푸쉬업을 시작하세요!'
            : '시작 버튼을 눌러 푸쉬업 카운팅을 시작하세요.'}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 40,
  },
  countContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 60,
  },
  countText: {
    fontSize: 80,
    fontWeight: 'bold',
  },
  countLabel: {
    fontSize: 30,
    fontWeight: 'bold',
    marginBottom: 15,
    marginLeft: 5,
  },
  button: {
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 30,
    marginBottom: 30,
  },
  startButton: {
    backgroundColor: '#4CAF50',
  },
  stopButton: {
    backgroundColor: '#F44336',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  instructionText: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.7,
  },
});

export default App;
