import React from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import {Icon} from '../../ui/Icon';
import {Text} from '../../ui/Text';
import {color, layout, radius, space} from '../../../theme';

interface SetupStepperProps {
  label: string;
  value: number;
  unit: string;
  min: number;
  max: number;
  step: number;
  changed: boolean;
  onChange: (value: number) => void;
}

const controls = [
  {icon: 'minus', delta: -1, action: '줄이기'},
  {icon: 'plus', delta: 1, action: '늘리기'},
] as const;

export function SetupStepper({
  label,
  value,
  unit,
  min,
  max,
  step,
  changed,
  onChange,
}: SetupStepperProps) {
  const tint = changed ? 'active' : 'text';

  return (
    <View style={styles.row}>
      <View style={styles.copy}>
        <Text variant="caption" color="textMuted" weight={600}>
          {label}
        </Text>
        <View style={styles.value}>
          <Text numeric weight={800} color={tint} style={styles.number}>
            {value}
          </Text>
          <Text variant="headline" weight={800} color={tint}>
            {unit}
          </Text>
        </View>
      </View>
      {controls.map(({icon, delta, action}) => {
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
    minHeight: 81,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: space[12],
    gap: space[8],
    borderBottomColor: color.border,
    borderBottomWidth: 1,
  },
  copy: {flex: 1, gap: space[4]},
  value: {flexDirection: 'row', flexWrap: 'wrap', alignItems: 'baseline'},
  number: {fontSize: 26, lineHeight: 30},
  button: {
    width: layout.touchMin,
    height: layout.touchMin,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: color.surface2,
    borderColor: color.border,
    borderWidth: 1,
    borderRadius: radius.pill,
  },
  dimmed: {opacity: 0.4},
});
