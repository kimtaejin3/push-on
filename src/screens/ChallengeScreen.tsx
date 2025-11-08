import React, {useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import usePushUpManager from '../hooks/usePushUpManager';
import CustomButton from '../components/common/CustomButton';
import Engagement from '../components/features/push-up/Engagement';
import ChallengeResult from '../components/features/push-up/ChallengeResult';
import {colors} from '../constants/colors';
import {useTimer} from '../hooks/useTimer';
import Count from '../components/features/push-up/Count';
import TimerContainer from '../components/features/push-up/TimerContainer';
import SetTitle from '../components/features/push-up/SetTitle';
import {formatTime} from '../utils/time';

function ChallengeScreen(): React.JSX.Element {
  const {
    pushUpCount,
    isTracking,
    isGoingDown,
    handleStartTracking,
    handleStopTracking,
  } = usePushUpManager();
  const {
    elapsedTime,
    isTimerRunning,
    handleStopTimer,
    handleStartAndResetTimer,
    handleResumeTimer,
  } = useTimer();
  const [showResult, setShowResult] = useState(false);

  if (showResult) {
    return <ChallengeResult pushUpCount={pushUpCount} duration={elapsedTime} />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <SetTitle />

        <Count pushUpCount={pushUpCount} isGoingDown={isGoingDown} />

        <TimerContainer formattedTime={formatTime(elapsedTime)} />
        <Engagement show={isTracking} pushUpCount={pushUpCount} />

        <View style={styles.footer}>
          <Text style={styles.instructionText}>
            {!isTracking && '기기를 얼굴과 마주보게 바닥에 두세요'}
          </Text>

          <View style={styles.buttonContainer}>
            {isTracking ? (
              <>
                <CustomButton
                  style={[styles.button, styles.pauseButton]}
                  title={isTimerRunning ? '일시정지' : '재개하기'}
                  variant="default"
                  onPress={isTimerRunning ? handleStopTimer : handleResumeTimer}
                />
                <CustomButton
                  style={[styles.button, styles.stopButton]}
                  title="종료하기"
                  variant="stop"
                  onPress={() => {
                    handleStopTracking();
                    handleStopTimer();
                    setShowResult(true);
                  }}
                />
              </>
            ) : (
              <CustomButton
                style={styles.button}
                title="시작하기"
                variant="start"
                onPress={() => {
                  handleStartAndResetTimer();
                  handleStartTracking();
                }}
              />
            )}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.backgroundDark,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
    zIndex: 1,
  },
  countLabel: {
    fontSize: 30,
    fontWeight: 'bold',
    marginBottom: 15,
    marginLeft: 5,
  },
  instructionText: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.8,
    color: colors.gray700,
  },
  footer: {
    marginTop: 'auto',
    width: '100%',
    alignItems: 'center',
    gap: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 15,
    width: '100%',
    justifyContent: 'center',
  },
  button: {
    backgroundColor: colors.primaryDark,
    shadowColor: colors.primary,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    flex: 1,
  },
  pauseButton: {
    backgroundColor: colors.gray300,
  },
  stopButton: {
    backgroundColor: colors.primary,
  },
});

export default ChallengeScreen;
