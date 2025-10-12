import React, {useEffect, useState, useRef} from 'react';
import {SafeAreaView, StyleSheet, Text, View, Animated} from 'react-native';
import usePushUpManager from '../../../hooks/usePushUpManager';
import CustomButton from '../../common/CustomButton';
import {useNavigation} from '@react-navigation/native';
import Engagement from '../../features/push-up/Engagement';
import ChallengeResult from './ChallengeResult';
import {colors} from '../../../constants/colors';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import {useTimer} from '../../../hooks/useTimer';
import Timer from '../../common/Timer';
import FontAwesome5 from '@react-native-vector-icons/fontawesome5';
import {pushupService} from '../../../services/pushupService';

function Challenge(): React.JSX.Element {
  const navigation = useNavigation();
  const {pushUpCount, isTracking, isGoingDown, startTracking, stopTracking} =
    usePushUpManager();
  const {formattedTime, stopTimer, startAndResetTimer, elapsedTime} =
    useTimer();
  const [showResult, setShowResult] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // 푸쉬업 카운트가 증가할 때 진동
  useEffect(() => {
    // 첫 번째 카운트는 진동하지 않음
    if (pushUpCount === 0) {
      return;
    }
    // 매우 짧은 진동 (1ms)
    ReactNativeHapticFeedback.trigger('impactHeavy', {
      enableVibrateFallback: true,
      ignoreAndroidSystemSettings: false,
    });
  }, [pushUpCount]);

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

  // 푸쉬업 세션 저장 및 홈으로 이동
  const handleSaveAndGoHome = async () => {
    try {
      await pushupService.savePushupSession({
        reps: pushUpCount,
        duration_seconds: elapsedTime,
        set_number: 1, // TODO: 실제 세트 번호로 변경
      });

      setShowResult(false);
      navigation.navigate('Tabs' as never);
    } catch (error) {
      console.error('푸쉬업 세션 저장 실패:', error);
      // 에러가 발생해도 홈으로 이동
      setShowResult(false);
      navigation.navigate('Tabs' as never);
    }
  };

  // isGoingDown 상태 변화 감지 및 애니메이션
  useEffect(() => {
    console.log('🔄 isGoingDown 상태 변경:', isGoingDown);

    Animated.timing(scaleAnim, {
      toValue: isGoingDown ? 0.85 : 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [isGoingDown, scaleAnim]);

  // 결과 화면 표시
  if (showResult) {
    return (
      <ChallengeResult
        pushUpCount={pushUpCount}
        duration={formattedTime}
        onSaveAndGoHome={handleSaveAndGoHome}
      />
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>SET 1</Text>

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
          <Timer time={formattedTime} style={styles.timeText} />
        </View>
        <Engagement show={isTracking} pushUpCount={pushUpCount} />

        <View style={styles.footer}>
          <Text style={styles.instructionText}>
            {!isTracking && '기기를 얼굴과 마주보게 바닥에 두세요'}
          </Text>

          <CustomButton
            style={styles.button}
            title={isTracking ? '그만하기' : '시작하기'}
            variant={isTracking ? 'stop' : 'start'}
            onPress={() => {
              if (isTracking) {
                handleStopTracking();
              } else {
                handleStartTracking();
              }
            }}
          />
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
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 40,
    color: colors.textLight,
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
  button: {
    backgroundColor: colors.primaryDark,
    shadowColor: colors.primary,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  countContainer: {
    borderWidth: 10,
    borderColor: '#a294e3',
    borderRadius: 9999,
    width: 250,
    height: 250,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    shadowColor: colors.lightBlue,
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 5,
  },
  countContainerActive: {
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
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
