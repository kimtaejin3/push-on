import React from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import {color, layout, radius, space} from '../../theme';
import {Icon} from './Icon';
import {Text} from './Text';

interface StepperProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (value: number) => void;
}

const directions = [
  {delta: -1, icon: 'minus', action: '줄이기'},
  {delta: 1, icon: 'plus', action: '늘리기'},
] as const;

export function Stepper({
  label,
  value,
  min,
  max,
  step = 1,
  unit,
  onChange,
}: StepperProps) {
  return (
    <View style={styles.row}>
      <View style={styles.copy}>
        <Text variant="caption" color="textMuted" weight={600}>
          {label}
        </Text>
        <Text variant="title" style={styles.value}>
          {value}
          {unit}
        </Text>
      </View>
      {directions.map(({delta, icon, action}) => {
        const next = Math.max(min, Math.min(max, value + delta * step));
        const disabled = value === next;
        return (
          <Pressable
            key={icon}
            accessibilityRole="button"
            accessibilityLabel={`${label} ${action}`}
            accessibilityState={{disabled}}
            disabled={disabled}
            onPress={() => onChange(next)}
            style={({pressed}) => [
              styles.button,
              (pressed || disabled) && styles.dimmed,
            ]}>
            <Icon name={icon} size={18} />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[8],
    paddingVertical: space[16],
    borderBottomWidth: 1,
    borderBottomColor: color.border,
  },
  copy: {flex: 1, gap: space[4]},
  value: {fontSize: 24},
  button: {
    width: layout.touchMin,
    height: layout.touchMin,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: color.surface2,
    borderWidth: 1,
    borderColor: color.border,
  },
  dimmed: {opacity: 0.4},
});
