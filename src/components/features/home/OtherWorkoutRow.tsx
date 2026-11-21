import React from 'react';
import {Layers} from 'lucide-react-native';
import {Pressable, StyleSheet, View} from 'react-native';
import {color, radius, space} from '../../../theme';
import {Icon, Text} from '../../ui';

interface OtherWorkoutRowProps {
  icon: 'zap' | 'layers';
  title: string;
  subtitle: string;
  best?: number | null;
  onPress: () => void;
}

export function OtherWorkoutRow({
  icon,
  title,
  subtitle,
  best,
  onPress,
}: OtherWorkoutRowProps) {
  const record = best == null ? undefined : `최고 ${best}`;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={subtitle}
      accessibilityValue={{text: record}}
      onPress={onPress}
      style={({pressed}) => [styles.row, pressed && styles.pressed]}>
      <View style={styles.icon}>
        {icon === 'layers' ? (
          <Layers size={20} color={color.text} accessible={false} />
        ) : (
          <Icon name={icon} />
        )}
      </View>
      <View style={styles.copy}>
        <Text weight={700}>{title}</Text>
        <Text variant="caption" color="textMuted">
          {subtitle}
        </Text>
      </View>
      {record && (
        <Text variant="label" weight={700} color="record" style={styles.record}>
          {record}
        </Text>
      )}
      <Icon name="chevron-right" size={20} color="textMuted" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    minHeight: 64,
    paddingVertical: space[8],
    borderBottomWidth: 1,
    borderBottomColor: color.border,
  },
  pressed: {opacity: 0.7},
  icon: {
    width: 40,
    height: 40,
    borderRadius: radius.m,
    backgroundColor: color.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {flex: 1},
  record: {flexShrink: 1},
});
