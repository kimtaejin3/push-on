import {useEffect, useRef, useState} from 'react';
import {Animated, Keyboard, StyleSheet, View, Text} from 'react-native';
import {colors} from '../../../constants/colors';
import {CustomTextInput} from '../../common/CustomTextInput';
import CustomButton from '../../common/CustomButton';
import {checkNicknameAvailability} from '../../../remote/profile';

function InputNickname({
  nickname,
  setNickname,
  onNext,
}: {
  nickname: string;
  setNickname: (value: string) => void;
  onNext: () => void;
}) {
  const questionAnim = useRef(new Animated.Value(0)).current;
  const inputAnim = useRef(new Animated.Value(0)).current;
  const hintAnim = useRef(new Animated.Value(0)).current;
  const buttonAnim = useRef(new Animated.Value(0)).current;

  const [nicknameError, setNicknameError] = useState<string | null>(null);
  const [isCheckingNickname, setIsCheckingNickname] = useState(false);

  const handleNicknameCheck = async () => {
    if (nickname.length === 0) {
      setNicknameError('닉네임을 입력해주세요.');
      return;
    }

    if (nickname.length < 2) {
      setNicknameError('닉네임은 2글자 이상 입력해주세요.');
      return;
    }

    setIsCheckingNickname(true);
    setNicknameError(null);

    try {
      const isAvailable = await checkNicknameAvailability(nickname);
      if (isAvailable) {
        onNext();
      } else {
        setNicknameError('이미 사용 중인 닉네임입니다.');
      }
    } catch (error) {
      setNicknameError('닉네임 확인 중 오류가 발생했습니다.');
    } finally {
      setIsCheckingNickname(false);
    }
  };

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
      Animated.timing(buttonAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, [questionAnim, inputAnim, hintAnim, buttonAnim]);

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
        <CustomTextInput
          value={nickname}
          onChangeText={text => {
            setNickname(text);
            setNicknameError(null); // 입력할 때마다 에러 메시지 초기화
          }}
          placeholder="예: 푸쉬업 사랑"
          keyboardType="default"
          maxLength={10}
          returnKeyType="next"
          onSubmitEditing={() => {
            Keyboard.dismiss();
          }}
        />
      </Animated.View>

      {!nicknameError && (
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
      )}

      {nicknameError && <Text style={styles.errorText}>{nicknameError}</Text>}

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
          title={isCheckingNickname ? '확인 중...' : '다음'}
          style={styles.onboardingButton}
          onPress={handleNicknameCheck}
          disabled={isCheckingNickname}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  questionContainer: {
    flex: 1,
    flexDirection: 'column',
    marginVertical: 70,
  },
  questionText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textLight,
    marginBottom: 80,
  },
  inputHint: {
    fontSize: 12,
    color: colors.gray400,
    marginTop: 10,
  },
  errorText: {
    fontSize: 12,
    color: colors.error || '#FF6B6B',
    marginTop: 8,
    textAlign: 'center',
  },
  onboardingButton: {
    backgroundColor: colors.primary,
  },
  buttonContainer: {
    marginTop: 'auto',
    width: '100%',
    alignItems: 'center',
  },
});

export default InputNickname;
