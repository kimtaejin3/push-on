import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {colors} from '../../../constants/colors';

interface RestTimerProps {
  remaining: number;
  onSkip: () => void;
  /** 방금 끝낸 세트 */
  last: {setNumber: number; reps: number; target: number; isMax: boolean};
  /** 휴식 뒤에 할 세트 */
  next: {setNumber: number; reps: number; isMax: boolean};
  /** 못 채웠을 때 그 자리에서 알려줄 이유·다음 할 일 (100개 챌린지에서 처음 못 채운 세트 직후) */
  note?: string;
}

function RestTimer({remaining, onSkip, last, next, note}: RestTimerProps) {
  const short = last.target - last.reps;
  return (
    <View style={styles.container}>
      <View style={styles.result}>
        <Text style={styles.resultText}>
          세트 {last.setNumber} · {last.reps} / {last.target}
          {last.isMax ? '+' : ''}
        </Text>
        {short > 0 ? (
          <Text style={styles.short}>{short}개 부족</Text>
        ) : (
          <Text style={styles.done}>완료</Text>
        )}
      </View>
      {note ? <Text style={styles.note}>{note}</Text> : null}

      <Text style={styles.label}>휴식</Text>
      <Text style={styles.seconds}>{remaining}</Text>
      <Text style={styles.next}>
        다음: 세트 {next.setNumber} ·{' '}
        {next.isMax ? `최소 ${next.reps}회, 가능한 만큼` : `목표 ${next.reps}회`}
      </Text>
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
  container: {flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center', gap: 10},
  result: {flexDirection: 'row', alignItems: 'baseline', gap: 10},
  resultText: {fontSize: 20, fontWeight: '600', color: colors.textLight},
  short: {fontSize: 16, fontWeight: '600', color: colors.warning},
  done: {fontSize: 16, fontWeight: '600', color: colors.success},
  note: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.textLight,
    textAlign: 'center',
    backgroundColor: colors.overlayLight,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    overflow: 'hidden',
  },
  label: {fontSize: 18, color: colors.textSecondary, marginTop: 16},
  seconds: {fontSize: 96, fontWeight: 'bold', color: colors.textLight},
  next: {fontSize: 15, color: colors.gray400},
  skip: {
    marginTop: 20,
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
