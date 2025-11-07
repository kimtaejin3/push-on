import React, {useEffect, useState, useRef} from 'react';
import {StyleSheet, Text, View, Animated} from 'react-native';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
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
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const insets = useSafeAreaInsets();

  // 추적 시작 시 타이머도 함께 시작
  const handleStartTracking = () => {
    startAndResetTimer();
    startTracking();
  };

  // 추적 중지 시 타이머도 중지하고 결과 화면 표시
  const handleStopTracking = () => {
    stopTimer();
    stopTracking();
    setShowResult(true);
  };

  // 타이머만 중지 (추적은 계속)
  const handlePauseTimer = () => {
    stopTimer();
  };

  const handleResumeTimer = () => {
    resumeTimer();
  };

  useEffect(() => {
    Animated.timing(scaleAnim, {
      toValue: isGoingDown ? 0.85 : 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [isGoingDown, scaleAnim]);

  // 결과 화면 표시
  if (showResult) {
    return <ChallengeResult pushUpCount={pushUpCount} duration={elapsedTime} />;
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        <SetTitle />

        <Animated.View
          style={[
            styles.countContainer,
            isGoingDown && styles.countContainerActive,
            {
              transform: [{scale: scaleAnim}],
            },
          ]}>
          <Text style={styles.countText}>{pushUpCount}</Text>
        </Animated.View>

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

          <View
            style={[
              styles.buttonContainer,
              {paddingBottom: insets.bottom || 34},
            ]}>
            {isTracking ? (
              <>
                <CustomButton
                  style={[styles.button, styles.pauseButton]}
                  title={isTimerRunning ? '일시정지' : '재개하기'}
                  variant="default"
                  onPress={
                    isTimerRunning ? handlePauseTimer : handleResumeTimer
                  }
                />
                <CustomButton
                  style={[styles.button, styles.stopButton]}
                  title="종료하기"
                  variant="stop"
                  onPress={handleStopTracking}
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
