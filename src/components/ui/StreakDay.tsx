import React from 'react';
import {StyleSheet, View} from 'react-native';
import type {DayMark} from '../../domain/streak';
import {color, layout, radius, space} from '../../theme';
import {Icon} from './Icon';
import {Text} from './Text';

interface StreakDayProps {
  label: string;
  mark: DayMark;
}

const markLabels: Record<DayMark, string> = {
  done: '완료',
  frozen: '보호됨',
  missed: '안 함',
  today: '오늘',
  future: '예정',
};

export function StreakDay({label, mark}: StreakDayProps) {
  return (
    <View
      style={styles.day}
      accessible
      accessibilityLabel={`${label}, ${markLabels[mark]}`}>
      <Text
        variant="caption"
        weight={600}
        color={mark === 'today' ? 'text' : 'textMuted'}>
        {label}
      </Text>
      <View style={[styles.mark, styles[mark]]}>
        {mark === 'done' && <Icon name="check" size={18} color="onBrand" />}
        {mark === 'today' && <Icon name="dumbbell" size={18} color="active" />}
        {mark === 'frozen' && <Icon name="snowflake" size={14} color="rest" />}
        {mark === 'missed' && <View style={styles.missedDot} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  day: {width: layout.touchMin, alignItems: 'center', gap: space[8]},
  mark: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  done: {backgroundColor: color.activeFill},
  frozen: {backgroundColor: color.surface2},
  missed: {},
  today: {borderWidth: 2, borderColor: color.active},
  future: {borderWidth: 2, borderColor: color.border},
  missedDot: {
    width: 6,
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: color.quiet,
  },
});
