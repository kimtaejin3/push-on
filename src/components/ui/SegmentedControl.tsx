import React from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import {color, layout, radius, space} from '../../theme';
import {Text} from './Text';

interface SegmentedControlProps {
  options: {key: string; label: string}[];
  value: string;
  onChange: (key: string) => void;
}

const hitSlop = {top: 2, bottom: 2, left: 0, right: 0};

export function SegmentedControl({
  options,
  value,
  onChange,
}: SegmentedControlProps) {
  return (
    <View accessibilityRole="tablist" style={styles.track}>
      {options.map(({key, label}) => {
        const selected = key === value;
        return (
          <Pressable
            key={key}
            accessibilityRole="tab"
            accessibilityState={{selected}}
            hitSlop={hitSlop}
            onPress={() => onChange(key)}
            style={({pressed}) => [
              styles.segment,
              selected && styles.selected,
              pressed && styles.pressed,
            ]}>
            <Text
              variant="label"
              color={selected ? 'text' : 'textMuted'}
              weight={selected ? 800 : 600}
              style={styles.label}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space[4],
    padding: space[4],
    borderRadius: radius.m,
    backgroundColor: color.surface,
  },
  segment: {
    flex: 1,
    minWidth: layout.touchMin,
    minHeight: 40,
    borderRadius: 9,
    justifyContent: 'center',
  },
  selected: {backgroundColor: color.surface2},
  pressed: {opacity: 0.7},
  label: {fontSize: 15, textAlign: 'center'},
});
