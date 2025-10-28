import {useEffect, useRef} from 'react';
import {Animated, StyleSheet, View, Text, Alert} from 'react-native';
import {colors} from '../../../constants/colors';
import CustomButton from '../../common/CustomButton';
import {useAuth} from '../../../hooks/useAuth';
import {useUpsertProfileMutation} from '../../../tanstack-query/mutationHooks/profile';

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

  const {user} = useAuth();

  const upsertProfileMutation = useUpsertProfileMutation(
    async () => {
      Alert.alert('성공', '목표가 설정되었습니다!', [
        {
          text: '확인',
          onPress: () => {
            onComplete();
          },
        },
      ]);
    },
    () => {
      Alert.alert('오류', '목표 설정 저장에 실패했습니다.');
    },
  );

  const handleSave = async () => {
    const reps = parseInt(targetRepsPerSet, 10);
    const sets = parseInt(targetSetsPerDay, 10);

    if (isNaN(reps) || reps < 1 || reps > 100) {
      Alert.alert(
        '오류',
        '세트당 목표 횟수는 1-100 사이의 숫자를 입력해주세요.',
      );
      return;
    }

    if (isNaN(sets) || sets < 1 || sets > 20) {
      Alert.alert(
        '오류',
        '하루 목표 세트 수는 1-20 사이의 숫자를 입력해주세요.',
      );
      return;
    }

    upsertProfileMutation.mutate({
      id: user?.id || '',
      target_reps_per_set: reps,
      target_sets_per_day: sets,
      nickname: nickname,
    });
  };

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
        프로필 설정 완료! 🎉
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

        <Text style={styles.noteText}>* 설정 탭에서 수정할 수 있어요.</Text>
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
        <CustomButton
          title="온보딩 완료하기"
          onPress={handleSave}
          disabled={upsertProfileMutation.isPending}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    backgroundColor: colors.overlayLight,
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
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
