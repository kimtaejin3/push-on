import React from 'react';
import {StyleSheet, View} from 'react-native';
import {color, radius, space} from '../../../theme';
import {Text} from '../../ui/Text';
import {SetMeter} from '../../ui/SetMeter';
import {Chip} from '../../ui/Chip';

interface WorkoutHeaderProps {
  phase: 'idle' | 'countdown' | 'tracking' | 'paused' | 'rest';
  set?: {current: number; total: number; results: number[]};
  title?: string;
}

function WorkoutHeader({phase, set, title}: WorkoutHeaderProps) {
  const resting = phase === 'rest';
  const tracking = phase === 'tracking';
  const tint = resting ? 'onAccent' : tracking ? 'onBrand' : 'text';
  const label = resting ? '쉬는 중' : tracking ? '세는 중' : undefined;
  return (
    <View style={styles.header}>
      <View style={styles.row}>
        {label ? (
          <View style={[styles.badge, resting && styles.restBadge]}>
            <View style={[styles.dot, {backgroundColor: color[tint]}]} />
            <Text variant="label" color={tint} weight={700}>
              {label}
            </Text>
          </View>
        ) : (
          <Chip
            label={phase === 'paused' ? '일시정지' : '준비'}
            tone="active"
          />
        )}
        {set ? (
          <View style={styles.set}>
            <Text
              variant="headline"
              color={tint === 'text' ? 'textMuted' : tint}>
              {resting ? '세트 끝' : '세트'}
            </Text>
            <Text variant="hero" color={tint} style={styles.number}>
              {set.current} / {set.total}
            </Text>
          </View>
        ) : title ? (
          <Text variant="label" color={tint} weight={700}>
            {title}
          </Text>
        ) : null}
      </View>
      {set && <SetMeter {...set} />}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {gap: space[8]},
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space[8],
  },
  set: {flexDirection: 'row', alignItems: 'baseline', gap: 6},
  number: {fontSize: 40, lineHeight: 44},
  badge: {
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[8],
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    backgroundColor: `${color.bg}33`,
  },
  restBadge: {backgroundColor: `${color.bg}1F`},
  dot: {width: 10, height: 10, borderRadius: 5},
});

export default WorkoutHeader;
