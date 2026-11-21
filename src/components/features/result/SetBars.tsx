import React from 'react';
import {StyleSheet, View} from 'react-native';
import {color} from '../../../theme';
import {Text} from '../../ui/Text';

interface SetBarsProps {
  results: number[];
  targets: number[];
  bestSetIndex: number;
  lastIsMax: boolean;
  freeSets: boolean;
}

export function SetBars({results, targets, bestSetIndex, lastIsMax, freeSets}: SetBarsProps) {
  const scale = 64 / Math.max(...results, 1);
  return (
    <View style={styles.chart}>
      {targets.map((target, index) => {
        const reps = results[index] ?? 0;
        const short = target - reps;
        const isMax = lastIsMax && index === targets.length - 1;
        const isBest = index === bestSetIndex && reps > 0;
        const tone = short > 0 ? 'alert' : isBest ? 'record' : 'text';
        const fill = short > 0
          ? `${color.alert}66`
          : isBest
          ? color.record
          : isMax || freeSets
          ? color.activeFill
          : color.quiet;
        return (
          <View
            key={index}
            accessible
            accessibilityLabel={`세트 ${index + 1}, 목표 ${target}${isMax ? ' 이상' : ''}, ${reps}개${short > 0 ? `, ${short}개 부족` : ''}`}
            style={styles.set}>
            <Text numeric weight={800} color={tone} style={styles.count}>{reps}</Text>
            <View style={[styles.bar, {height: Math.max(2, reps * scale), backgroundColor: fill}]} />
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  chart: {minHeight: 96, flexDirection: 'row', alignItems: 'flex-end', gap: 10},
  set: {flex: 1, alignItems: 'center', gap: 6},
  bar: {
    width: '100%',
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
  },
  count: {fontSize: 22, lineHeight: 26},
});
