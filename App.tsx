/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, {useEffect, useState, useRef} from 'react';
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

// 응원 문구 배열
const encouragements = [
  '잘하고 있어요! 계속 힘내세요!',
  '멋져요! 한 개 더 할 수 있어요!',
  '포기하지 마세요! 당신은 할 수 있어요!',
  '훌륭해요! 목표까지 조금만 더!',
  '대단해요! 계속 도전하세요!',
  '끝까지 해내세요! 당신은 강합니다!',
  '거의 다 왔어요! 조금만 더 힘내세요!',
  '놀라운 의지력이네요! 계속 가세요!',
  '당신의 노력이 결실을 맺을 거예요!',
  '한계를 뛰어넘어 보세요! 당신은 할 수 있어요!',
];

function App(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';
  const [count, setCount] = useState(0);
  const [isTracking, setIsTracking] = useState(false);
  const [encouragement, setEncouragement] = useState('');
  const prevCountRef = useRef(0);

  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
    flex: 1,
  };

  // 랜덤 응원 문구 선택 함수
  const getRandomEncouragement = () => {
    const randomIndex = Math.floor(Math.random() * encouragements.length);
    return encouragements[randomIndex];
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

          // 카운트가 증가했을 때만 새로운 응원 문구 표시
          if (currentCount > prevCountRef.current) {
            setEncouragement(getRandomEncouragement());
          }

          prevCountRef.current = currentCount;
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
      prevCountRef.current = 0;
      setEncouragement('');
    } else {
      // 시작할 때 초기 응원 문구 설정
      setEncouragement('시작해볼까요! 화이팅!');
    }
  };

  return (
    <SafeAreaView style={backgroundStyle}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={backgroundStyle.backgroundColor}
      />
      <View style={styles.container}>
        <Text style={styles.title}>SET 1</Text>

        <Text style={styles.countText}>{count}</Text>
        {/* 응원문구 */}
        <Text style={styles.encouragementText}>{encouragement}</Text>

        <Text style={styles.instructionText}>
          {isTracking
            ? '핸드폰을 얼굴에 향한채 바닥에 두고 푸쉬업을 시작하세요!'
            : '시작 버튼을 눌러 푸쉬업 카운팅을 시작하세요.'}
        </Text>
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
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 40,
  },
  countText: {
    fontSize: 80,
    fontWeight: '400',
    marginTop: 100,
  },
  countLabel: {
    fontSize: 30,
    fontWeight: 'bold',
    marginBottom: 15,
    marginLeft: 5,
  },
  button: {
    paddingVertical: 20,
    paddingHorizontal: 80,
    borderRadius: 15,
    marginBottom: 30,
    width: '100%',
    fontSize: 14,
    textAlign: 'center',
  },
  startButton: {
    backgroundColor: '#FF6969',
  },
  stopButton: {
    backgroundColor: '#F44336',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    width: '100%',
  },
  instructionText: {
    marginTop: 'auto',
    marginBottom: 10,
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.7,
  },
  encouragementText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#FF6969',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
});

export default App;
