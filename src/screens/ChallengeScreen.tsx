import React, {useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import usePushUpManager from '../hooks/usePushUpManager';
import CustomButton from '../components/common/CustomButton';
import Engagement from '../components/features/push-up/Engagement';
import ChallengeResult from '../components/features/push-up/ChallengeResult';
import ProgramTestResult from '../components/features/program/ProgramTestResult';
import {colors} from '../constants/colors';
import Count from '../components/features/push-up/Count';
import TimerContainer from '../components/features/push-up/TimerContainer';
import {formatTime} from '../utils/time';
import {RouteProp, useRoute} from '@react-navigation/native';
import {AppStackParamList} from '../navigations/AppNavigation';

function ChallengeScreen(): React.JSX.Element {
  const route = useRoute<RouteProp<AppStackParamList, 'Challenge'>>();
  const purpose = route.params?.purpose;
  const {
    pushUpCount,
    isTracking,
    isGoingDown,
    isPaused,
    timer: {elapsedTime},
    handleStartTracking,
    handlePauseTracking,
    handleResumeTracking,
    handleStopTracking,
  } = usePushUpManager();

  const [isPushUpFinished, setIsPushUpFinished] = useState(false);

  const handleFinishPushUp = () => {
    setIsPushUpFinished(true);
  };

  if (isPushUpFinished) {
    // 100개 챌린지의 테스트는 결과를 해석해 프로그램에 반영하는 전용 화면을 쓴다
    return purpose === 'program-test' ? (
      <ProgramTestResult reps={pushUpCount} duration={elapsedTime} />
    ) : (
      <ChallengeResult pushUpCount={pushUpCount} duration={elapsedTime} />
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.modeTitle}>{purpose === 'program-test' ? '최대 횟수 테스트' : '챌린지'}</Text>

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
                  title={isPaused ? '재개하기' : '일시정지'}
                  variant="default"
                  onPress={
                    isPaused ? handleResumeTracking : handlePauseTracking
                  }
                />
                <CustomButton
                  style={[styles.button, styles.stopButton]}
                  title="종료하기"
                  variant="stop"
                  onPress={() => {
                    handleStopTracking();
                    handleFinishPushUp();
                  }}
                />
              </>
            ) : (
              <CustomButton
                style={styles.button}
                title="시작하기"
                variant="start"
                onPress={handleStartTracking}
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
  modeTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 40,
    color: colors.textSecondary,
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
