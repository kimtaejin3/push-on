import React, {type ReactNode} from 'react';
import {Pressable, StyleSheet, View, type PressableProps} from 'react-native';
import {color, space} from '../../theme';
import {Icon, type LucideName} from './Icon';
import {Text} from './Text';

interface RowProps {
  title: string;
  subtitle?: string;
  value?: string;
  icon?: LucideName;
  onPress?: PressableProps['onPress'];
  right?: ReactNode;
  destructive?: boolean;
}

export function Row({
  title,
  subtitle,
  value,
  icon,
  onPress,
  right,
  destructive,
}: RowProps) {
  const content = (
    <>
      {icon ? (
        <Icon name={icon} color={destructive ? 'alert' : 'textMuted'} />
      ) : null}
      <View style={styles.copy}>
        <Text weight={600} color={destructive ? 'alert' : 'text'}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="caption" color="textMuted">
            {subtitle}
          </Text>
        ) : null}
      </View>
      {value ? (
        <Text variant="label" color="textMuted" style={styles.value}>
          {value}
        </Text>
      ) : null}
      {right ??
        (onPress && <Icon name="chevron-right" size={18} color="textMuted" />)}
    </>
  );

  return onPress ? (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({pressed}) => [styles.row, pressed && styles.pressed]}>
      {content}
    </Pressable>
  ) : (
    <View style={styles.row}>{content}</View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    minHeight: 56,
    paddingVertical: space[8],
    borderBottomColor: color.border,
    borderBottomWidth: 1,
  },
  copy: {flex: 1, gap: space[4]},
  value: {flexShrink: 1},
  pressed: {opacity: 0.7},
});
