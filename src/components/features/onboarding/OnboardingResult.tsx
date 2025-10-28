import {useEffect, useRef} from 'react';
import {Animated, StyleSheet, View, Text} from 'react-native';
import {colors} from '../../../constants/colors';
import CustomButton from '../../common/CustomButton';

interface OnboardingResultProps {
  nickname: string;
  targetRepsPerSet: string;
  targetSetsPerDay: string;
  onComplete: () => void;
}

function OnboardingResult({
  nickname,
  targetRepsPerSet,
  targetSetsPerDay,
  onComplete,
}: OnboardingResultProps) {
  const titleAnim = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(0)).current;
  const buttonAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(titleAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(contentAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(buttonAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [titleAnim, contentAnim, buttonAnim]);

  return (
    <View style={styles.container}>
      <Animated.Text
        style={[
          styles.title,
          {
            opacity: titleAnim,
            transform: [
              {
                translateY: titleAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [30, 0],
                }),
              },
            ],
          },
        ]}>
        목표 설정 완료! 🎉
      </Animated.Text>

      <Animated.View
        style={[
          styles.contentContainer,
          {
            opacity: contentAnim,
            transform: [
              {
                translateY: contentAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              },
            ],
          },
        ]}>
        <View style={styles.resultCard}>
          <Text style={styles.cardTitle}>설정된 목표</Text>

          <View style={styles.resultItem}>
            <Text style={styles.resultLabel}>닉네임</Text>
            <Text style={styles.resultValue}>{nickname}</Text>
          </View>

          <View style={styles.resultItem}>
            <Text style={styles.resultLabel}>세트당 목표 횟수</Text>
            <Text style={styles.resultValue}>{targetRepsPerSet}회</Text>
          </View>

          <View style={styles.resultItem}>
            <Text style={styles.resultLabel}>하루 목표 세트 수</Text>
            <Text style={styles.resultValue}>{targetSetsPerDay}세트</Text>
          </View>
        </View>

        <Text style={styles.noteText}>
          * 수정은 할 수 없습니다. 나중에 설정 탭에서 수정할 수 있어요.
        </Text>
      </Animated.View>

      <Animated.View
        style={[
          styles.buttonContainer,
          {
            opacity: buttonAnim,
            transform: [
              {
                translateY: buttonAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [30, 0],
                }),
              },
            ],
          },
        ]}>
        <CustomButton title="온보딩 완료하기" onPress={onComplete} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 40,
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textLight,
    textAlign: 'center',
    marginBottom: 40,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  resultCard: {
    backgroundColor: colors.background || '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    shadowColor: colors.shadow,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textLight,
    marginBottom: 20,
    textAlign: 'center',
  },
  resultItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray400 || '#E5E5E5',
  },
  resultLabel: {
    fontSize: 16,
    color: colors.textSecondary || '#666666',
    fontWeight: '500',
  },
  resultValue: {
    fontSize: 16,
    color: colors.textLight,
    fontWeight: 'bold',
  },
  noteText: {
    fontSize: 12,
    color: colors.gray400 || '#999999',
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 18,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
  },
});

export default OnboardingResult;
