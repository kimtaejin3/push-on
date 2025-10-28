import {useState} from 'react';
import {Animated, Keyboard, StyleSheet, View, Text} from 'react-native';
import {colors} from '../../../constants/colors';
import {CustomTextInput} from '../../common/CustomTextInput';
import CustomButton from '../../common/CustomButton';
import {checkNicknameAvailability} from '../../../remote/profile';
import {
  useSequentialAnimation,
  createFadeInStyle,
  createSlideUpStyle,
  createSlideDownStyle,
} from '../../../hooks/useSequentialAnimation';

function InputNickname({
  nickname,
  setNickname,
  onNext,
}: {
  nickname: string;
  setNickname: (value: string) => void;
  onNext: () => void;
}) {
  const [nicknameError, setNicknameError] = useState<string | null>(null);
  const [isCheckingNickname, setIsCheckingNickname] = useState(false);

  const [questionAnim, inputAnim, hintAnim, buttonAnim] =
    useSequentialAnimation(4, {
      durations: [400, 300, 250, 100],
    });

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

  return (
    <View style={styles.questionContainer}>
      <Animated.Text
        style={[styles.questionText, createFadeInStyle(questionAnim, 20)]}>
        사용할 닉네임을 입력해주세요
      </Animated.Text>
      <Animated.View style={createSlideUpStyle(inputAnim, 15)}>
        <CustomTextInput
          value={nickname}
          onChangeText={text => {
            setNickname(text);
            setNicknameError(null);
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
          style={[styles.inputHint, createSlideDownStyle(hintAnim, 10)]}>
          나중에 수정할 수 있어요
        </Animated.Text>
      )}

      {nicknameError && <Text style={styles.errorText}>{nicknameError}</Text>}

      <Animated.View
        style={[styles.buttonContainer, createFadeInStyle(buttonAnim, 30)]}>
        <CustomButton
          title={isCheckingNickname ? '확인 중...' : '다음'}
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
