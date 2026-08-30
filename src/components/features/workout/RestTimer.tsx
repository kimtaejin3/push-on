import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
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
      {/* 부차적 동작이므로 채움 없는 outlined 버튼 (주 버튼처럼 보이지 않게) */}
      <Pressable
        onPress={onSkip}
        hitSlop={8}
        style={({pressed}) => [styles.skip, pressed && styles.skipPressed]}>
        <Text style={styles.skipText}>건너뛰기</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12},
  label: {fontSize: 18, color: colors.textSecondary},
  seconds: {fontSize: 96, fontWeight: 'bold', color: colors.textLight},
  hint: {fontSize: 14, color: colors.gray400},
  skip: {
    marginTop: 24,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.overlayMedium,
  },
  skipPressed: {
    backgroundColor: colors.overlayLight,
  },
  skipText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});

export default RestTimer;
