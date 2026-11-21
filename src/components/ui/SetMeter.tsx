import React from 'react';
import {StyleSheet, View} from 'react-native';
import {color, space} from '../../theme';

interface SetMeterProps {
  total: number;
  current: number;
  results?: number[];
}

export function SetMeter({total, current, results}: SetMeterProps) {
  // current는 1부터 시작하고, 휴식 중에는 현재 세트도 완료 목록에 들어간다.
  const completed = Math.min(
    total,
    Math.max(0, results?.length ?? current - 1),
  );
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel="세트 진행"
      accessibilityValue={{min: 0, max: total, now: completed}}
      style={styles.meter}>
      {Array.from({length: total}, (_, index) => (
        <View
          key={index}
          style={[
            styles.segment,
            index < completed && styles.completed,
            index >= completed && index === current - 1 && styles.current,
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  meter: {flexDirection: 'row', gap: 6},
  segment: {
    flex: 1,
    height: 8,
    borderRadius: space[4],
    backgroundColor: `${color.onBrand}26`,
  },
  completed: {backgroundColor: color.active},
  current: {backgroundColor: color.activeDim},
});
