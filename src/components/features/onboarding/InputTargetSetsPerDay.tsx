import {Alert, Animated, Keyboard, StyleSheet, View} from 'react-native';
import {colors} from '../../../constants/colors';
import {CustomTextInput} from '../../common/CustomTextInput';
import CustomButton from '../../common/CustomButton';
import {
  useSequentialAnimation,
  createFadeInStyle,
  createSlideUpStyle,
  createSlideDownStyle,
} from '../../../hooks/useSequentialAnimation';

function InputTargetSetsPerDay({
  targetSetsPerDay,
  setTargetSetsPerDay,
  onNext,
}: {
  targetSetsPerDay: string;
  setTargetSetsPerDay: (value: string) => void;
  onNext: () => void;
}) {
  // 애니메이션 훅 사용
  const [questionAnim, inputAnim, hintAnim, buttonAnim] =
    useSequentialAnimation(4, {
      durations: [400, 300, 250, 100],
    });

  return (
    <View style={styles.questionContainer}>
      <Animated.Text
        style={[styles.questionText, createFadeInStyle(questionAnim, 20)]}>
        하루에 몇 세트를 목표로 하시나요?
      </Animated.Text>
      <Animated.View style={createSlideUpStyle(inputAnim, 15)}>
        <CustomTextInput
          value={targetSetsPerDay}
          onChangeText={setTargetSetsPerDay}
          placeholder="예: 3"
          keyboardType="numeric"
          maxLength={2}
          returnKeyType="done"
          onSubmitEditing={() => {
            Keyboard.dismiss();
          }}
        />
      </Animated.View>
      <Animated.Text
        style={[styles.inputHint, createSlideDownStyle(hintAnim, 10)]}>
        나중에 수정할 수 있어요
      </Animated.Text>

      <Animated.View
        style={[styles.buttonContainer, createFadeInStyle(buttonAnim, 30)]}>
        <CustomButton
          title="완료"
          onPress={() => {
            if (targetSetsPerDay.length === 0) {
              Alert.alert('하루에 목표 세트 수를 입력해주세요.');
              return;
            }
            onNext();
          }}
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
  buttonContainer: {
    marginTop: 'auto',
    width: '100%',
    alignItems: 'center',
  },
});

export default InputTargetSetsPerDay;
