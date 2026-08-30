import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import CustomButton from '../../common/CustomButton';
import {colors} from '../../../constants/colors';

interface RestTimerProps {
  remaining: number;
  onSkip: () => void;
}

function RestTimer({remaining, onSkip}: RestTimerProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>휴식</Text>
      <Text style={styles.seconds}>{remaining}</Text>
      <Text style={styles.hint}>끝나면 다음 세트를 시작할 수 있어요</Text>
      <CustomButton title="건너뛰기" variant="default" style={styles.button} onPress={onSkip} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12},
  label: {fontSize: 18, color: colors.textSecondary},
  seconds: {fontSize: 96, fontWeight: 'bold', color: colors.textLight},
  hint: {fontSize: 14, color: colors.gray400},
  button: {marginTop: 24, minWidth: 160},
});

export default RestTimer;
