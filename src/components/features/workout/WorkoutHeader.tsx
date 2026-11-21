import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {colors} from '../../../constants/colors';

interface WorkoutHeaderProps {
  setNumber: number; // 1-based
  totalSets: number;
  target: {reps: number; isMax: boolean};
  /** 카운팅 중일 때의 현재 횟수. 주면 목표까지 남은 개수를 함께 보여준다 */
  count?: number;
}

const remainingText = (target: {reps: number; isMax: boolean}, count: number): string => {
  const left = target.reps - count;
  if (left > 0) {
    return `${left}개 남음`;
  }
  return target.isMax ? '최소 달성, 가능한 만큼 더' : '달성';
};

function WorkoutHeader({setNumber, totalSets, target, count}: WorkoutHeaderProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.set}>
        세트 {setNumber} / {totalSets}
      </Text>
      <Text style={styles.target}>
        {target.isMax ? `최소 ${target.reps}회, 가능한 만큼` : `목표 ${target.reps}회`}
        {count !== undefined ? (
          <Text style={styles.remaining}> · {remainingText(target, count)}</Text>
        ) : null}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {alignItems: 'center', gap: 4, marginBottom: 32},
  set: {fontSize: 26, fontWeight: 'bold', color: colors.textSecondary},
  target: {fontSize: 15, color: colors.gray400},
  remaining: {color: colors.primaryLight, fontWeight: '600'},
});

export default WorkoutHeader;
