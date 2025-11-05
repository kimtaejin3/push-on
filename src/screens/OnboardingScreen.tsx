import React, {useState} from 'react';
import {
  StyleSheet,
  TouchableWithoutFeedback,
  Keyboard,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
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
