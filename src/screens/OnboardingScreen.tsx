import React, {useState, useEffect, useRef} from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
  Alert,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
  Animated,
} from 'react-native';
import {colors} from '../constants/colors';
import CustomButton from '../components/common/CustomButton';
import {useAuth} from '../hooks/useAuth';
import {useUpsertProfileMutation} from '../tanstack-query/mutationHooks/profile';
import InputNickname from '../components/features/onboarding/InputNickName';
import InputTargetSetsPerDay from '../components/features/onboarding/InputTargetSetsPerDay';
import InputTargetRepsPerSet from '../components/features/onboarding/InputTargetRepsPerSet';

function OnboardingScreen({onComplete}: {onComplete: () => void}) {
  const {user} = useAuth();
  const [targetRepsPerSet, setTargetRepsPerSet] = useState('');
  const [targetSetsPerDay, setTargetSetsPerDay] = useState('');

  const [step, setStep] = useState(0);
  const [nickname, setNickname] = useState('');

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
  // 애니메이션 값들
  const titleAnim = useRef(new Animated.Value(0)).current;
  const descriptionAnim = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(0)).current;
  const buttonAnim = useRef(new Animated.Value(0)).current;

  // TODO: 나중에 훅으로 분리
  useEffect(() => {
    // 페이지 로드 시 순차적 애니메이션 실행
    Animated.sequence([
      // 제목 애니메이션 (첫 번째)
      Animated.timing(titleAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      // 설명 애니메이션 (두 번째)
      Animated.timing(descriptionAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      // 콘텐츠 애니메이션 (세 번째)
      Animated.timing(contentAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      // 버튼 애니메이션 (네 번째)
      Animated.timing(buttonAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [titleAnim, descriptionAnim, contentAnim, buttonAnim]);

  const handleSave = async () => {
    if (step === 0 || step === 1) {
      return;
    }

    const reps = parseInt(targetRepsPerSet, 10);
    console.log('targetSetsPerDay', targetSetsPerDay);

    const sets = parseInt(targetSetsPerDay, 10);

    console.log('sets', sets);

    // 입력값 검증
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

  return (
    <SafeAreaView style={styles.container}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled">
          <Animated.Text
            style={[
              styles.onboardingTitle,
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
            온보딩
          </Animated.Text>
          <Animated.Text
            style={[
              styles.onboardingDescription,
              {
                opacity: descriptionAnim,
                transform: [
                  {
                    translateY: descriptionAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 0],
                    }),
                  },
                ],
              },
            ]}>
            푸쉬핏에 오신 것을 환영합니다!
          </Animated.Text>

          <View>
            {step === 0 && (
              <InputNickname nickname={nickname} setNickname={setNickname} />
            )}
            {step === 1 && (
              <InputTargetRepsPerSet
                targetRepsPerSet={targetRepsPerSet}
                setTargetRepsPerSet={setTargetRepsPerSet}
              />
            )}

            {step === 2 && (
              <InputTargetSetsPerDay
                targetSetsPerDay={targetSetsPerDay}
                setTargetSetsPerDay={setTargetSetsPerDay}
                onSave={handleSave}
              />
            )}
          </View>

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
              title={(() => {
                if (upsertProfileMutation.isPending) {
                  return '저장 중...';
                }
                if (step === 0) {
                  return '다음';
                }
                if (step === 1) {
                  return '다음';
                }
                return '온보딩 완료';
              })()}
              style={styles.onboardingButton}
              onPress={() => {
                if (step === 0) {
                  if (nickname.length === 0) {
                    Alert.alert('오류', '닉네임을 입력해주세요');
                    return;
                  }
                  setStep(1);
                } else if (step === 1) {
                  if (targetRepsPerSet.length === 0) {
                    Alert.alert('오류', '세트당 목표 횟수를 입력해주세요');
                    return;
                  }
                  setStep(2);
                } else {
                  if (targetSetsPerDay.length === 0) {
                    Alert.alert('오류', '하루 목표 세트 수를 입력해주세요');
                    return;
                  }
                  handleSave();
                }
              }}
              disabled={upsertProfileMutation.isPending}
            />
          </Animated.View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}



const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundDark,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    padding: 20,
  },
  onboardingTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.textLight,
    textAlign: 'center',
    marginBottom: 20,
  },
  onboardingDescription: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 24,
  },
  buttonContainer: {
    marginTop: 'auto',
    width: '100%',
    alignItems: 'center',
  },
  onboardingButton: {
    backgroundColor: colors.primary,
  },
});

export default OnboardingScreen;
