import React, {useEffect, useMemo} from 'react';
import {SafeAreaView, StyleSheet, Text, View, Dimensions} from 'react-native';
import usePushUpManager from '../../../hooks/usePushUpManager';
import CustomButton from '../../common/CustomButton';
import {useNavigation} from '@react-navigation/native';
import Engagement from '../../features/push-up/Engagement';
import {colors} from '../../../constants/colors';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import {useTimer} from '../../../hooks/useTimer';
import Timer from '../../common/Timer';
import FontAwesome5 from '@react-native-vector-icons/fontawesome5';

const generateCircles = () => {
  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;
  const circles = [];

  for (let i = 0; i < 30; i++) {
    const size = Math.random() * 8 + 4; // 4-12px 크기
    const opacity = Math.random() * 0.3 + 0.1; // 0.1-0.4 투명도
    const left = Math.random() * screenWidth;
    const top = Math.random() * screenHeight;

    circles.push(
      <View
        key={i}
        style={[
          styles.circle,
          {
            width: size,
            height: size,
            left: left,
            top: top,
            opacity: opacity,
          },
        ]}
      />,
    );
  }
  return circles;
};

function Challenge(): React.JSX.Element {
  const navigation = useNavigation();
  const {pushUpCount, isTracking, isGoingDown, startTracking, stopTracking} =
    usePushUpManager();
  const {formattedTime, stopTimer, startAndResetTimer} = useTimer();
  const generatedCircles = useMemo(() => generateCircles(), []);

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

  // 동그라미 패턴 생성

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* 동그라미 패턴 배경 */}
      <View style={styles.backgroundPattern}>{generatedCircles}</View>

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
    backgroundColor: colors.grayLight,
  },
  backgroundPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  circle: {
    position: 'absolute',
    borderRadius: 50,
    backgroundColor: colors.primary,
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
    color: colors.gray600,
  },
  countText: {
    fontSize: 50,
    fontWeight: '400',
    color: colors.gray800,
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
    borderWidth: 5,
    borderColor: colors.lightBlue,
    borderRadius: 9999,
    width: 230,
    height: 230,
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
    borderWidth: 8,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    shadowColor: colors.primary,
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
    transform: [{scale: 1.05}],
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 20,
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
