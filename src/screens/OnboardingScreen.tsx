import React, {useState, useEffect, useRef} from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Alert,
  TouchableWithoutFeedback,
  Keyboard,
  Animated,
  View,
} from 'react-native';
import {colors} from '../constants/colors';
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

  return (
    <SafeAreaView style={styles.container}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.content}>
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

          {(() => {
            if (step === 0) {
              return (
                <InputNickname
                  nickname={nickname}
                  setNickname={setNickname}
                  onNext={() => setStep(1)}
                />
              );
            }
            if (step === 1) {
              return (
                <InputTargetRepsPerSet
                  targetRepsPerSet={targetRepsPerSet}
                  setTargetRepsPerSet={setTargetRepsPerSet}
                  onNext={() => setStep(2)}
                />
              );
            }
            if (step === 2) {
              return (
                <InputTargetSetsPerDay
                  targetSetsPerDay={targetSetsPerDay}
                  setTargetSetsPerDay={setTargetSetsPerDay}
                  onSave={handleSave}
                />
              );
            }
          })()}
        </View>
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
    flex: 1,
    paddingTop: 20,
    paddingHorizontal: 20,
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
});

export default OnboardingScreen;
