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

/**
 * 폰트가 글자를 잘리지 않게 그리려면 줄 높이가 글자 크기의 이만큼은 돼야 한다
 * (Big Shoulders·Asta Sans 모두 hhea ascent − descent ≈ 1.2em).
 * 디자인은 큰 숫자를 0.85~0.9em 으로 촘촘하게 쌓는데, 그 값을 lineHeight 로 그대로 주면
 * iOS·Android 가 글자 윗부분을 잘라 버린다.
 */
const NATURAL_LINE_HEIGHT = 1.2;

const sideMargin = (
  flat: TextStyle,
  side: 'Top' | 'Bottom',
): number => {
  const value =
    flat[`margin${side}`] ?? flat.marginVertical ?? flat.margin ?? 0;
  return typeof value === 'number' ? value : 0;
};

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
  const flat = StyleSheet.flatten(style) ?? {};

  const fontSize = flat.fontSize ?? typography.fontSize;
  // 디자인이 원하는 줄 높이: 직접 준 값 > 글자 크기만 바꿨으면 변형의 비율 > 변형 값
  const designLineHeight =
    flat.lineHeight ??
    (flat.fontSize !== undefined
      ? Math.round((fontSize * typography.lineHeight) / typography.fontSize)
      : typography.lineHeight);
  const lineHeight = Math.max(
    designLineHeight,
    Math.ceil(fontSize * NATURAL_LINE_HEIGHT),
  );
  // 늘어난 만큼 위아래 바깥 여백을 줄여, 주변 배치는 디자인의 촘촘한 간격 그대로 둔다
  const trim = (designLineHeight - lineHeight) / 2;
  const trimStyle: TextStyle | null =
    trim < 0
      ? {
          marginTop: sideMargin(flat, 'Top') + trim,
          marginBottom: sideMargin(flat, 'Bottom') + trim,
        }
      : null;

  return (
    <NativeText
      style={[
        styles.text,
        {
          color: color[textColor],
          fontFamily: fontFamilyFor(
            role,
            weight ?? typography.weight,
            Platform.OS === 'ios' ? 'ios' : 'android',
          ),
        },
        flat,
        {fontSize, lineHeight},
        trimStyle,
      ]}>
      {children}
    </NativeText>
  );
}

const styles = StyleSheet.create({
  text: {includeFontPadding: false},
});
