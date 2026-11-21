import React, {useRef} from 'react';
import {StyleSheet, Text, View, Animated} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import CustomButton from '../../common/CustomButton';
import {colors} from '../../../constants/colors';
import FontAwesome5 from '@react-native-vector-icons/fontawesome5';
import {StackActions, useNavigation} from '@react-navigation/native';
import {useSavePushupSessionMutation} from '../../../tanstack-query';
import {useStreakCelebration} from '../streak/StreakCelebrationProvider';
import {
  useSequentialAnimation,
  createScaleRotateStyle,
  createFadeInStyle,
} from '../../../hooks/useSequentialAnimation';

interface ChallengeResultProps {
  pushUpCount: number;
  duration: number;
}

/** 챌린지 모드 결과 화면. (100개 챌린지의 테스트 결과는 ProgramTestResult 가 맡는다) */
function ChallengeResult({pushUpCount, duration}: ChallengeResultProps): React.JSX.Element {
  const [iconAnim, titleAnim, subtitleAnim] = useSequentialAnimation(3, {
    durations: [500, 400, 300],
  });
  const navigation = useNavigation();

  // navigate 는 기존 화면으로 돌아가지 않고 새로 쌓으므로(React Navigation 7) popTo 로 돌아간다
  const goNext = () => navigation.dispatch(StackActions.popTo('Tabs'));
  const {celebrateThen} = useStreakCelebration();

  // 저장(또는 폰에 보관)됐으면 오늘 운동한 것이다 → 그날 첫 운동이면 축하 화면을 거친다.
  // 저장하지 않는 0개 결과와 저장 실패(로그인 안 됨)는 바로 이동한다
  const savePushupMutation = useSavePushupSessionMutation(() => celebrateThen(goNext), error => {
    console.error('푸쉬업 세션 저장 실패:', error);
    goNext();
  });

  // 이 화면에서는 한 번만 저장한다. 다시 누르면 새 시각으로 한 번 더 저장되어 중복 확인으로도 걸러지지 않는다.
  // 저장이 끝난 뒤에도 축하 화면 준비(최대 1.5초) 동안 이 화면에 머무르므로 isPending 만으로는 막지 못한다
  const saveStarted = useRef(false);

  const handleSaveAndGoHome = () => {
    if (pushUpCount === 0 || saveStarted.current) {
      return;
    }
    saveStarted.current = true;
    savePushupMutation.mutate({
      reps: pushUpCount,
      duration_seconds: duration,
      mode: 'challenge',
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Animated.View style={createScaleRotateStyle(iconAnim)}>
            {pushUpCount > 0 ? (
              <FontAwesome5
                name="check-circle"
                iconStyle="solid"
                size={60}
                color={colors.primary}
              />
            ) : (
              <FontAwesome5
                name="times-circle"
                iconStyle="solid"
                size={60}
                color={colors.primary}
              />
            )}
          </Animated.View>
          <Animated.Text
            style={[
              styles.title,
              pushUpCount === 0 && styles.titleError,
              createFadeInStyle(titleAnim, 30),
            ]}>
            {pushUpCount > 0 ? '훌륭해요!' : '측정된 푸쉬업 횟수가 없어요!'}
          </Animated.Text>
          <Animated.Text
            style={[styles.subtitle, createFadeInStyle(subtitleAnim, 20)]}>
            {pushUpCount > 0 ? '세트를 완료했습니다' : '다시 시도해보세요!'}
          </Animated.Text>
        </View>

        <View style={styles.resultContainer}>
          <View style={styles.resultItem}>
            <Text style={styles.resultNumber}>{pushUpCount}</Text>
            <Text style={styles.resultLabel}>푸쉬업</Text>
          </View>

          <View style={styles.resultItem}>
            <Text style={styles.resultNumber}>{duration}</Text>
            <Text style={styles.resultLabel}>소요시간</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <CustomButton
            style={styles.saveButton}
            title={pushUpCount > 0 ? '기록하고 홈으로 이동' : '홈으로 이동'}
            variant="start"
            onPress={pushUpCount > 0 ? handleSaveAndGoHome : goNext}
            disabled={savePushupMutation.isPending || savePushupMutation.isSuccess}
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
  },
  header: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.textLight,
    marginTop: 20,
    marginBottom: 10,
  },
  titleError: {
    fontSize: 24,
  },
  subtitle: {
    fontSize: 18,
    color: colors.gray400,
    textAlign: 'center',
  },
  resultContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 60,
  },
  resultItem: {
    alignItems: 'center',
    backgroundColor: colors.overlayMedium,
    padding: 30,
    borderRadius: 20,
    minWidth: 120,
  },
  resultNumber: {
    fontSize: 36,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 8,
  },
  resultLabel: {
    fontSize: 16,
    color: colors.gray400,
    fontWeight: '500',
  },
  footer: {
    marginTop: 'auto',
    width: '100%',
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: colors.primaryDark,
    shadowColor: colors.primary,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});

export default ChallengeResult;
