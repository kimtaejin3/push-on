import React from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import usePushUpManager from '../hooks/usePushUpManager';
import useHandleEngagements from '../hooks/useHandleEngagements';

function Challenge(): React.JSX.Element {
  const {count, isTracking, toggleTracking} = usePushUpManager({
    countIncrementCallback: (currentCount: number) => {
      if (currentCount === 0) {
        //TODO: 이 부분 더 고민해서 적용 필요
        setFirstEncouragement();
        return;
      }
      setRandomEncouragement();
    },
  });

  const {encouragement, setRandomEncouragement, setFirstEncouragement} =
    useHandleEngagements();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>SET 1</Text>

        <Text style={styles.countText}>{count}</Text>
        <Text style={styles.encouragementText}>{encouragement}</Text>

        <Text style={styles.instructionText}>
          {!isTracking && '기기를 얼굴과 마주보게 바닥에 두세요'}
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
  safeArea: {
    flex: 1,
  },
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

export default Challenge;
