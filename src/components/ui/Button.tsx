import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  type PressableProps,
} from 'react-native';
import {color, layout, radius, space} from '../../theme';
import {Icon, type LucideName} from './Icon';
import {Text} from './Text';

interface ButtonProps {
  variant: 'primary' | 'secondary' | 'text';
  title: string;
  onPress: NonNullable<PressableProps['onPress']>;
  disabled?: boolean;
  loading?: boolean;
  icon?: LucideName;
}

export function Button({
  variant,
  title,
  onPress,
  disabled = false,
  loading = false,
  icon,
}: ButtonProps) {
  const unavailable = disabled || loading;
  const textButton = variant === 'text';
  const tint = variant === 'primary' ? 'onBrand' : 'text';
  const glyph = icon ? (
    <Icon
      name={icon}
      color={textButton ? 'textMuted' : tint}
      size={textButton ? 16 : 20}
    />
  ) : null;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{disabled: unavailable, busy: loading}}
      disabled={unavailable}
      onPress={onPress}
      style={({pressed}) => [
        styles.base,
        styles[variant],
        disabled && styles.disabled,
        (loading || pressed) && styles.pressed,
      ]}>
      {loading ? (
        <ActivityIndicator color={color[tint]} />
      ) : (
        !textButton && glyph
      )}
      <Text
        color={tint}
        weight={textButton ? 700 : 800}
        style={textButton ? styles.textLabel : styles.label}>
        {title}
      </Text>
      {textButton && !loading && glyph}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: layout.touchMin,
    minHeight: layout.primaryButtonHeight,
    borderRadius: radius.m,
    gap: space[8],
    paddingHorizontal: space[24],
  },
  primary: {backgroundColor: color.activeButton},
  secondary: {
    backgroundColor: color.surface2,
    borderColor: color.border,
    borderWidth: 1,
  },
  text: {
    alignSelf: 'flex-start',
    justifyContent: 'flex-start',
    minHeight: layout.touchMin,
    paddingHorizontal: space[12],
    gap: 6,
  },
  label: {fontSize: 17, flexShrink: 1, textAlign: 'center'},
  textLabel: {fontSize: 15, flexShrink: 1},
  disabled: {opacity: 0.4},
  pressed: {opacity: 0.7},
});
