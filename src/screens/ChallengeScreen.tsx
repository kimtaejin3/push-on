import React, {useEffect} from 'react';
import {SafeAreaView, StyleSheet, Text, View} from 'react-native';
import usePushUpManager from '../hooks/usePushUpManager';
import CustomButton from '../components/common/CustomButton';
import {useNavigation} from '@react-navigation/native';
import Engagement from '../components/features/push-up/Engagement';
import {colors} from '../constants/colors';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import {useTimer} from '../hooks/useTimer';
import Timer from '../components/common/Timer';
import FontAwesome5 from '@react-native-vector-icons/fontawesome5';

function ChallengeScreen(): React.JSX.Element {
  const navigation = useNavigation();
  const {pushUpCount, isTracking, isGoingDown, startTracking, stopTracking} =
    usePushUpManager();
  const {formattedTime, stopTimer, startAndResetTimer} = useTimer();

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
    console.log('pushUpCount!', pushUpCount);
  }, [pushUpCount]);

  // 추적 시작 시 타이머도 함께 시작
  const handleStartTracking = () => {
    startAndResetTimer();
    startTracking();
  };

  // 추적 중지 시 타이머도 중지
  const handleStopTracking = () => {
    stopTimer();
    stopTracking();
  };

  // isGoingDown 상태 변화 감지
  useEffect(() => {
    console.log('🔄 isGoingDown 상태 변경:', isGoingDown);
  }, [isGoingDown]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>SET 1</Text>

        <View
          style={[
            styles.countContainer,
            isGoingDown && styles.countContainerActive,
          ]}>
          <Text style={styles.countText}>{pushUpCount}</Text>
        </View>

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
            title={isTracking ? '중지하기' : '시작하기'}
            variant={isTracking ? 'stop' : 'start'}
            onPress={() => {
              if (isTracking) {
                handleStopTracking();
                navigation.goBack();
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
    backgroundColor: colors.backgroundLight,
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
    fontSize: 50,
    fontWeight: '400',
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
    opacity: 0.7,
  },
  footer: {
    marginTop: 'auto',
    width: '100%',
    alignItems: 'center',
    gap: 20,
  },
  button: {
    backgroundColor: colors.primaryDark,
  },
  countContainer: {
    borderWidth: 5,
    borderColor: colors.lightBlue,
    borderRadius: 9999,
    width: 230,
    height: 230,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countContainerActive: {
    borderColor: colors.primary, // 활성화 시 파란색으로 변경
    borderWidth: 8, // 더 두꺼운 테두리
    backgroundColor: colors.backgroundAccent, // 배경색 추가
    shadowColor: colors.primary, // 그림자 효과
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5, // Android 그림자
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 20,
  },
  timeText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.gray500,
  },
});

export default ChallengeScreen;
