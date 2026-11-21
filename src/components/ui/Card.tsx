import React, {type ReactNode} from 'react';
import {StyleSheet, View, type StyleProp, type ViewStyle} from 'react-native';
import {color, radius, space} from '../../theme';

interface CardProps {
  tone?: 'surface' | 'brand';
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function Card({tone = 'surface', children, style}: CardProps) {
  return (
    <View style={[styles.card, tone === 'brand' && styles.brand, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: color.surface,
    borderRadius: radius.l,
    padding: space[20],
    gap: 14,
  },
  brand: {backgroundColor: color.activeFill},
});
