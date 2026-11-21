import React, {type ReactNode} from 'react';
import {
  Platform,
  StyleSheet,
  Text as NativeText,
  type StyleProp,
  type TextStyle,
} from 'react-native';
import {
  color,
  fontFamilyFor,
  textVariants,
  type FontWeight,
  type TextVariant,
} from '../../theme';

interface TextProps {
  variant?: TextVariant;
  color?: keyof typeof color;
  weight?: FontWeight;
  numeric?: boolean;
  style?: StyleProp<TextStyle>;
  children: ReactNode;
}

export function Text({
  variant = 'body',
  color: textColor = 'text',
  weight,
  numeric,
  style,
  children,
}: TextProps) {
  const typography = textVariants[variant];
  const role = numeric === undefined ? typography.role : numeric ? 'num' : 'ko';
  return (
    <NativeText
      style={[
        styles.text,
        {
          color: color[textColor],
          fontSize: typography.fontSize,
          fontFamily: fontFamilyFor(
            role,
            weight ?? typography.weight,
            Platform.OS === 'ios' ? 'ios' : 'android',
          ),
        },
        style,
      ]}>
      {children}
    </NativeText>
  );
}

const styles = StyleSheet.create({
  text: {includeFontPadding: false},
});
