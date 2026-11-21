import React from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import {color, layout, radius} from '../../theme';

interface ToggleProps {
  value: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}

export function Toggle({value, onChange, disabled = false}: ToggleProps) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{checked: value, disabled}}
      disabled={disabled}
      onPress={() => onChange(!value)}
      style={({pressed}) => [
        styles.target,
        disabled && styles.disabled,
        pressed && styles.pressed,
      ]}>
      <View style={[styles.track, value && styles.on]}>
        <View style={styles.thumb} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  target: {width: 52, height: layout.touchMin, justifyContent: 'center'},
  track: {
    height: 32,
    borderRadius: radius.pill,
    paddingHorizontal: 3,
    justifyContent: 'center',
    alignItems: 'flex-start',
    backgroundColor: color.surface2,
  },
  on: {backgroundColor: color.activeFill, alignItems: 'flex-end'},
  thumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: color.onBrand,
  },
  disabled: {opacity: 0.4},
  pressed: {opacity: 0.7},
});
