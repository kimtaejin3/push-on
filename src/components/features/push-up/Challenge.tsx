import React, {useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import usePushUpManager from '../../../hooks/usePushUpManager';
import CustomButton from '../../common/CustomButton';
import Engagement from '../../features/push-up/Engagement';
import ChallengeResult from './ChallengeResult';
import {colors} from '../../../constants/colors';
import {useTimer} from '../../../hooks/useTimer';
import Timer from '../../common/Timer';
import FontAwesome5 from '@react-native-vector-icons/fontawesome5';
import {useQuery} from '@tanstack/react-query';
import {pushUpSetsByDateQueryOptions} from '../../../tanstack-query';
import {formatTime} from '../../../utils/time';
import AnimatedCounter from '../../common/AnimatedCounter';

function Challenge(): React.JSX.Element {
  const {pushUpCount, isTracking, isGoingDown, startTracking, stopTracking} =
    usePushUpManager();
  const {
    elapsedTime,
    isTimerRunning,
    stopTimer,
    startAndResetTimer,
    resumeTimer,
  } = useTimer();
  const [showResult, setShowResult] = useState(false);

  if (showResult) {
    return <ChallengeResult pushUpCount={pushUpCount} duration={elapsedTime} />;
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        <SetTitle />

        <AnimatedCounter
          count={pushUpCount}
          isActive={isGoingDown}
          style={styles.countContainer}
          activeStyle={styles.countContainerActive}
        />

        <View style={styles.timeContainer}>
          <FontAwesome5
            name="clock"
            iconStyle="solid"
            size={17}
            color={colors.gray400}
          />
          <Timer time={formatTime(elapsedTime)} style={styles.timeText} />
        </View>
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
                  onPress={isTimerRunning ? stopTimer : resumeTimer}
                />
                <CustomButton
                  style={[styles.button, styles.stopButton]}
                  title="종료하기"
                  variant="stop"
                  onPress={() => {
                    stopTimer();
                    stopTracking();
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
                  startAndResetTimer();
                  startTracking();
                }}
              />
            )}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

function SetTitle() {
  const today = new Date();
  const {year, month, day} = {
    year: today.getFullYear(),
    month: today.getMonth() + 1,
    day: today.getDate(),
  };

  const {data: pushupSets, isLoading} = useQuery(
    pushUpSetsByDateQueryOptions(year, month, day),
  );

  if (isLoading || !pushupSets) {
    return (
      <View>
        <Text>SET -</Text>
      </View>
    );
  }

  return <Text style={styles.title}>SET {pushupSets.length + 1}</Text>;
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
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 40,
    color: colors.textSecondary,
  },
  countText: {
    fontSize: 70,
    fontWeight: '400',
    color: colors.textLight,
  },
  countLabel: {
    fontSize: 30,
    fontWeight: 'bold',
    marginBottom: 15,
    marginLeft: 5,
  },
  instructionText: {
    marginTop: 'auto',
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
  countContainer: {
    borderWidth: 10,
    borderColor: colors.primaryLight,
    borderRadius: 9999,
    width: 250,
    height: 250,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.lightBlue,
  },
  countContainerActive: {
    borderColor: colors.primary,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 40,
    marginBottom: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: colors.gray900,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  timeText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textLight,
    textShadowColor: colors.gray900,
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 2,
  },
});

export default Challenge;
