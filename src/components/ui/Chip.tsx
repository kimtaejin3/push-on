import React from 'react';
import {Pressable, StyleSheet, View, type PressableProps} from 'react-native';
import {color, layout, radius, space} from '../../theme';
import {Text} from './Text';

type ChipTone = 'neutral' | 'active' | 'rest' | 'alert' | 'record';

interface ChipProps {
  label: string;
  tone?: ChipTone;
  selected?: boolean;
  onPress?: PressableProps['onPress'];
}

const statusBackground = {
  active: color.activeTint,
  rest: `${color.rest}1F`,
  alert: `${color.alert}1F`,
  record: `${color.record}1F`,
};

export function Chip({label, tone = 'neutral', selected, onPress}: ChipProps) {
  const status = tone !== 'neutral';
  const tint = status ? tone : selected ? 'active' : 'text';
  const face = (
    <View
      style={[
        styles.face,
        status ? styles.status : styles.choice,
        {backgroundColor: status ? statusBackground[tone] : color.surface2},
        selected && styles.selected,
      ]}>
      {status && <View style={[styles.dot, {backgroundColor: color[tint]}]} />}
      <Text variant="label" color={tint} weight={status ? 700 : 600}>
        {label}
      </Text>
    </View>
  );

  return onPress ? (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{selected}}
      onPress={onPress}
      style={({pressed}) => [styles.target, pressed && styles.pressed]}>
      {face}
    </Pressable>
  ) : (
    face
  );
}

const styles = StyleSheet.create({
  target: {
    minWidth: layout.touchMin,
    minHeight: layout.touchMin,
    justifyContent: 'center',
  },
  face: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space[8],
  },
  status: {minHeight: 36, paddingHorizontal: 14, borderRadius: radius.pill},
  choice: {
    minHeight: 40,
    paddingHorizontal: space[16],
    borderRadius: radius.chip,
    borderWidth: 1,
    borderColor: color.border,
  },
  selected: {
    backgroundColor: color.activeTint,
    borderColor: color.active,
    borderWidth: 1,
  },
  dot: {width: 10, height: 10, borderRadius: 5},
  pressed: {opacity: 0.7},
});
