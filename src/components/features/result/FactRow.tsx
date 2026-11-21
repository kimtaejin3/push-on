import React from 'react';
import {StyleSheet, View} from 'react-native';
import {color, radius, space} from '../../../theme';
import {Text} from '../../ui/Text';

interface FactRowProps {
  label: string;
  value: string;
  tone?: 'text' | 'active' | 'alert' | 'record';
}

export function FactRow({label, value, tone = 'text'}: FactRowProps) {
  return (
    <View style={styles.row}>
      <View style={styles.label}>
        <Text color="textMuted">{label}</Text>
        {tone === 'record' && (
          <View style={styles.badge}>
            <View style={styles.dot} />
            <Text color="record" weight={700} style={styles.badgeLabel}>
              최고 기록
            </Text>
          </View>
        )}
      </View>
      <Text style={styles.value} weight={800} color={tone}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 52,
    paddingVertical: space[8],
    borderBottomWidth: 1,
    borderBottomColor: color.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space[8],
  },
  label: {flexShrink: 1, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: space[8]},
  value: {flexShrink: 1, textAlign: 'right'},
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[8],
    minHeight: 26,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
    backgroundColor: `${color.record}1F`,
  },
  dot: {width: 6, height: 6, borderRadius: 3, backgroundColor: color.record},
  badgeLabel: {fontSize: 12, lineHeight: 16},
});
