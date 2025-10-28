import React, {useState, useEffect, useRef} from 'react';
import {
  SafeAreaView,
  StyleSheet,
  TouchableWithoutFeedback,
  Keyboard,
  Animated,
  View,
} from 'react-native';
import {colors} from '../constants/colors';
import InputNickname from '../components/features/onboarding/InputNickName';
import InputTargetSetsPerDay from '../components/features/onboarding/InputTargetSetsPerDay';
import InputTargetRepsPerSet from '../components/features/onboarding/InputTargetRepsPerSet';
import OnboardingResult from '../components/features/onboarding/OnboardingResult';

function OnboardingScreen({onComplete}: {onComplete: () => void}) {
  const [onboardingData, setOnboardingData] = useState({
    nickname: '',
    targetRepsPerSet: '',
    targetSetsPerDay: '',
  });
  const [step, setStep] = useState(0);

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

  return (
    <SafeAreaView style={styles.container}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.content}>
          {(() => {
            if (step === 0) {
              return (
                <InputNickname
                  nickname={onboardingData.nickname}
                  setNickname={nickname =>
                    setOnboardingData(prev => ({...prev, nickname}))
                  }
                  onNext={() => setStep(1)}
                />
              );
            }
            if (step === 1) {
              return (
                <InputTargetRepsPerSet
                  targetRepsPerSet={onboardingData.targetRepsPerSet}
                  setTargetRepsPerSet={targetRepsPerSet =>
                    setOnboardingData(prev => ({...prev, targetRepsPerSet}))
                  }
                  onNext={() => setStep(2)}
                />
              );
            }
            if (step === 2) {
              return (
                <InputTargetSetsPerDay
                  targetSetsPerDay={onboardingData.targetSetsPerDay}
                  setTargetSetsPerDay={targetSetsPerDay =>
                    setOnboardingData(prev => ({...prev, targetSetsPerDay}))
                  }
                  onNext={() => {
                    setStep(3);
                  }}
                />
              );
            }
            if (step === 3) {
              return (
                <OnboardingResult
                  nickname={onboardingData.nickname}
                  targetRepsPerSet={onboardingData.targetRepsPerSet}
                  targetSetsPerDay={onboardingData.targetSetsPerDay}
                  onComplete={onComplete}
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
