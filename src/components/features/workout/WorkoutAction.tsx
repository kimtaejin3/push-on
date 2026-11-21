import React from 'react';
import {Pressable, StyleSheet} from 'react-native';
import {SkipForward, Square} from 'lucide-react-native';
import {color, layout, radius, space} from '../../../theme';
import {Icon, type LucideName} from '../../ui/Icon';
import {Text} from '../../ui/Text';

interface WorkoutActionProps {
  title: string;
  icon: LucideName | 'square' | 'skip-forward';
  variant: 'tracking' | 'rest' | 'restPrimary';
  iconOnly?: boolean;
  onPress: () => void;
}

export function WorkoutAction({
  title,
  icon,
  variant,
  iconOnly,
  onPress,
}: WorkoutActionProps) {
  const tint =
    variant === 'tracking'
      ? 'onBrand'
      : variant === 'restPrimary'
      ? 'rest'
      : 'onAccent';
  const glyph =
    icon === 'square' ? (
      <Square size={20} color={color[tint]} accessible={false} />
    ) : icon === 'skip-forward' ? (
      <SkipForward size={20} color={color[tint]} accessible={false} />
    ) : (
      <Icon name={icon} color={tint} />
    );
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      style={({pressed}) => [
        styles.action,
        styles[variant],
        iconOnly && styles.iconOnly,
        pressed && styles.pressed,
      ]}>
      {glyph}
      {!iconOnly && (
        <Text color={tint} weight={800} style={styles.label}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  action: {
    flex: 1,
    minHeight: layout.primaryButtonHeight,
    minWidth: layout.touchMin,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space[8],
    paddingHorizontal: space[8],
    borderRadius: radius.m,
    borderWidth: 1,
  },
  tracking: {
    backgroundColor: `${color.bg}40`,
    borderColor: `${color.onBrand}33`,
  },
  rest: {backgroundColor: `${color.bg}1A`, borderColor: `${color.bg}40`},
  restPrimary: {backgroundColor: color.bg, borderColor: color.bg},
  iconOnly: {flexGrow: 0, flexBasis: layout.primaryButtonHeight},
  label: {fontSize: 17, flexShrink: 1, textAlign: 'center'},
  pressed: {opacity: 0.7},
});
