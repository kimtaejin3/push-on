import React from 'react';
import {StyleSheet, Text, View, Animated} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import CustomButton from '../../common/CustomButton';
import {colors} from '../../../constants/colors';
import FontAwesome5 from '@react-native-vector-icons/fontawesome5';
import {StackActions, useNavigation} from '@react-navigation/native';
import {useSavePushupSessionMutation} from '../../../tanstack-query';
import {
  useSequentialAnimation,
  createScaleRotateStyle,
  createFadeInStyle,
} from '../../../hooks/useSequentialAnimation';

interface ChallengeResultProps {
  pushUpCount: number;
  duration: number;
  /** 100개 프로그램의 초기/재테스트로 쓰일 때 */
  purpose?: 'program-test';
}

function ChallengeResult({
  pushUpCount,
  duration,
  purpose,
}: ChallengeResultProps): React.JSX.Element {
  const [iconAnim, titleAnim, subtitleAnim] = useSequentialAnimation(3, {
    durations: [500, 400, 300],
  });
  const navigation = useNavigation();

  const isProgramTest = purpose === 'program-test';

  // navigate 는 기존 화면으로 돌아가지 않고 새로 쌓으므로(React Navigation 7) popTo 로 돌아간다
  const goNext = () => {
    if (isProgramTest) {
      navigation.dispatch(StackActions.popTo('Program', {testReps: pushUpCount}));
    } else {
      navigation.dispatch(StackActions.popTo('Tabs'));
    }
  };

  const savePushupMutation = useSavePushupSessionMutation(goNext, error => {
    console.error('푸쉬업 세션 저장 실패:', error);
    goNext();
  });

  const handleSaveAndGoHome = () => {
    if (pushUpCount === 0) {
      return;
    }
    savePushupMutation.mutate({
      reps: pushUpCount,
      duration_seconds: duration,
      mode: isProgramTest ? 'program_test' : 'challenge',
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
            title={
              pushUpCount > 0
                ? isProgramTest
                  ? '기록하고 프로그램으로'
                  : '기록하고 홈으로 이동'
                : isProgramTest
                ? '프로그램으로'
                : '홈으로 이동'
            }
            variant="start"
            onPress={() => {
              if (pushUpCount > 0) {
                handleSaveAndGoHome();
              } else if (isProgramTest) {
                navigation.dispatch(StackActions.popTo('Program'));
              } else {
                navigation.dispatch(StackActions.popTo('Tabs'));
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
