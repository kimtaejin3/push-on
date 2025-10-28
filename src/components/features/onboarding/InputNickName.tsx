import { useEffect, useRef } from 'react';
import { Animated, Keyboard, StyleSheet, View } from 'react-native';
import { colors } from '../../../constants/colors';
import { CustomTextInput } from '../../common/CustomTextInput';

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
          <CustomTextInput
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


const styles = StyleSheet.create({
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
    inputHint: {
      fontSize: 12,
      color: colors.gray400,
      marginTop: 10,
    },
  });


  export default InputNickname;
