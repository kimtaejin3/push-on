import React, {useState, useEffect, useRef} from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
  TextInput,
  Alert,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
  Animated,
} from 'react-native';
import {colors} from '../constants/colors';
import CustomButton from '../components/common/CustomButton';
import {supabase} from '../lib/supabase';
import {useAuth} from '../hooks/useAuth';
import {useIsOnboarded} from '../hooks/useIsOnboarded';

function OnboardingScreen({onComplete}: {onComplete: () => void}) {
  const {user} = useAuth();
  const {refresh} = useIsOnboarded();
  const [targetRepsPerSet, setTargetRepsPerSet] = useState('');
  const [targetSetsPerDay, setTargetSetsPerDay] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [step, setStep] = useState(0);
  const [nickname, setNickname] = useState('');
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

  // 스텝 변경 시 애니메이션 리셋
  useEffect(() => {
    // 스텝이 변경될 때마다 애니메이션 재시작
    titleAnim.setValue(0);
    descriptionAnim.setValue(0);
    contentAnim.setValue(0);
    buttonAnim.setValue(0);

    Animated.sequence([
      Animated.timing(titleAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(descriptionAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(contentAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(buttonAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  }, [step, titleAnim, descriptionAnim, contentAnim, buttonAnim]);

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

    try {
      setIsLoading(true);

      // 프로필 생성 또는 업데이트
      const {error} = await supabase.from('profiles').upsert({
        id: user?.id,
        target_reps_per_set: reps,
        target_sets_per_day: sets,
        nickname: nickname,
      });

      if (error) {
        console.error('프로필 저장 오류:', error);
        Alert.alert('오류', '목표 설정 저장에 실패했습니다.');
      } else {
        Alert.alert('성공', '목표가 설정되었습니다!', [
          {
            text: '확인',
            onPress: async () => {
              // 온보딩 상태 새로고침
              await refresh();
              console.log('온보딩 완료');
              onComplete();
            },
          },
        ]);
      }
    } catch (error) {
      console.error('온보딩 저장 오류:', error);
      Alert.alert('오류', '목표 설정 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
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

          <Animated.View
            style={{
              opacity: contentAnim,
              transform: [
                {
                  translateY: contentAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [40, 0],
                  }),
                },
              ],
            }}>
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
              title={(() => {
                if (isLoading) {
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
                  setStep(1);
                } else if (step === 1) {
                  setStep(2);
                } else {
                  handleSave();
                }
              }}
              disabled={isLoading}
            />
          </Animated.View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}

function InputNickname({
  nickname,
  setNickname,
}: {
  nickname: string;
  setNickname: (value: string) => void;
}) {
  const questionAnim = useRef(new Animated.Value(0)).current;
  const inputAnim = useRef(new Animated.Value(0)).current;
  const hintAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(questionAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(inputAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(hintAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  }, [questionAnim, inputAnim, hintAnim]);

  return (
    <View style={styles.questionContainer}>
      <Animated.Text
        style={[
          styles.questionText,
          {
            opacity: questionAnim,
            transform: [
              {
                translateY: questionAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              },
            ],
          },
        ]}>
        사용할 닉네임을 입력해주세요
      </Animated.Text>
      <Animated.View
        style={{
          opacity: inputAnim,
          transform: [
            {
              translateY: inputAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [15, 0],
              }),
            },
          ],
        }}>
        <TextInput
          style={styles.input}
          value={nickname}
          onChangeText={setNickname}
          placeholder="예: 푸쉬업 사랑"
          keyboardType="default"
          maxLength={10}
          returnKeyType="next"
          onSubmitEditing={() => {
            Keyboard.dismiss();
          }}
        />
      </Animated.View>
      <Animated.Text
        style={[
          styles.inputHint,
          {
            opacity: hintAnim,
            transform: [
              {
                translateY: hintAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [10, 0],
                }),
              },
            ],
          },
        ]}>
        나중에 수정할 수 있어요
      </Animated.Text>
    </View>
  );
}

function InputTargetRepsPerSet({
  targetRepsPerSet,
  setTargetRepsPerSet,
}: {
  targetRepsPerSet: string;
  setTargetRepsPerSet: (value: string) => void;
}) {
  const questionAnim = useRef(new Animated.Value(0)).current;
  const inputAnim = useRef(new Animated.Value(0)).current;
  const hintAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(questionAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(inputAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(hintAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  }, [questionAnim, inputAnim, hintAnim]);

  return (
    <View style={styles.questionContainer}>
      <Animated.Text
        style={[
          styles.questionText,
          {
            opacity: questionAnim,
            transform: [
              {
                translateY: questionAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              },
            ],
          },
        ]}>
        세트당 목표 횟수는 몇 회인가요?
      </Animated.Text>
      <Animated.View
        style={{
          opacity: inputAnim,
          transform: [
            {
              translateY: inputAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [15, 0],
              }),
            },
          ],
        }}>
        <TextInput
          style={styles.input}
          value={targetRepsPerSet}
          onChangeText={setTargetRepsPerSet}
          placeholder="예: 10"
          keyboardType="numeric"
          maxLength={3}
          returnKeyType="next"
          onSubmitEditing={() => {
            Keyboard.dismiss();
          }}
        />
      </Animated.View>
      <Animated.Text
        style={[
          styles.inputHint,
          {
            opacity: hintAnim,
            transform: [
              {
                translateY: hintAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [10, 0],
                }),
              },
            ],
          },
        ]}>
        나중에 수정할 수 있어요
      </Animated.Text>
    </View>
  );
}

function InputTargetSetsPerDay({
  targetSetsPerDay,
  setTargetSetsPerDay,
}: {
  targetSetsPerDay: string;
  setTargetSetsPerDay: (value: string) => void;
  onSave: () => void;
}) {
  const questionAnim = useRef(new Animated.Value(0)).current;
  const inputAnim = useRef(new Animated.Value(0)).current;
  const hintAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(questionAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(inputAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(hintAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  }, [questionAnim, inputAnim, hintAnim]);

  return (
    <View style={styles.questionContainer}>
      <Animated.Text
        style={[
          styles.questionText,
          {
            opacity: questionAnim,
            transform: [
              {
                translateY: questionAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              },
            ],
          },
        ]}>
        하루에 몇 세트를 목표로 하시나요?
      </Animated.Text>
      <Animated.View
        style={{
          opacity: inputAnim,
          transform: [
            {
              translateY: inputAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [15, 0],
              }),
            },
          ],
        }}>
        <TextInput
          style={styles.input}
          value={targetSetsPerDay}
          onChangeText={setTargetSetsPerDay}
          placeholder="예: 3"
          keyboardType="numeric"
          maxLength={2}
          returnKeyType="done"
          onSubmitEditing={() => {
            Keyboard.dismiss();
          }}
          placeholderTextColor={colors.textSecondary}
        />
      </Animated.View>
      <Animated.Text
        style={[
          styles.inputHint,
          {
            opacity: hintAnim,
            transform: [
              {
                translateY: hintAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [10, 0],
                }),
              },
            ],
          },
        ]}>
        나중에 수정할 수 있어요
      </Animated.Text>
    </View>
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
  questionContainer: {
    marginVertical: 70,
    borderRadius: 12,
    shadowColor: colors.shadow,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  questionText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textLight,
    marginBottom: 80,
  },
  input: {
    borderColor: colors.primary,
    borderBottomWidth: 2,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.textLight,
    fontWeight: 'bold',
  },
  inputHint: {
    fontSize: 12,
    color: colors.gray400,
    marginTop: 10,
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
