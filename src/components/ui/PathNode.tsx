import React from 'react';
import {StyleSheet, View} from 'react-native';
import {color} from '../../theme';
import {Icon} from './Icon';
import {Text} from './Text';

type PathStatus = 'done' | 'today' | 'upcoming' | 'skipped' | 'locked';

interface PathNodeProps {
  status: PathStatus;
  label: string;
  size?: number;
}

const statusLabels: Record<PathStatus, string> = {
  done: '완료',
  today: '오늘',
  upcoming: '예정',
  skipped: '건너뜀',
  locked: '잠김',
};

export function PathNode({
  status,
  label,
  size = status === 'today' ? 60 : 48,
}: PathNodeProps) {
  return (
    <View
      style={[
        styles.base,
        styles[status],
        {width: size, height: size, borderRadius: size / 2},
      ]}
      accessible
      accessibilityLabel={`${label}, ${statusLabels[status]}`}>
      {status === 'done' && <Icon name="check" size={22} color="onBrand" />}
      {status === 'today' && <Icon name="play" size={22} color="active" />}
      {status === 'upcoming' && (
        <Text
          variant="headline"
          numeric={/^\d+$/.test(label)}
          weight={800}
          color="textMuted">
          {label}
        </Text>
      )}
      {status === 'skipped' && (
        <Icon name="minus" size={18} color="textMuted" />
      )}
      {status === 'locked' && <Icon name="lock" size={18} color="textMuted" />}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {alignItems: 'center', justifyContent: 'center'},
  done: {backgroundColor: color.activeFill},
  today: {
    backgroundColor: color.activeTint,
    borderWidth: 3,
    borderColor: color.active,
  },
  upcoming: {borderWidth: 2, borderColor: color.border},
  skipped: {borderWidth: 2, borderColor: color.border, borderStyle: 'dashed'},
  locked: {
    backgroundColor: color.surface2,
    borderWidth: 2,
    borderColor: color.border,
  },
});
