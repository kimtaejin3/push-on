import React from 'react';
import {StyleSheet, View} from 'react-native';
import {color, radius, space} from '../../../theme';
import {Text} from '../../ui/Text';

interface TimerContainerProps {
  label: string;
  detail?: string;
  progress?: number;
  resting?: boolean;
}

function TimerContainer({
  label,
  detail,
  progress,
  resting = false,
}: TimerContainerProps) {
  const tint = resting ? 'onAccent' : 'onBrand';
  const fraction =
    progress === undefined ? undefined : Math.min(Math.max(progress, 0), 1);
  return (
    <View style={styles.container}>
      <View style={styles.labels}>
        <Text color={tint} variant="headline" style={styles.label}>
          {label}
        </Text>
        {detail ? (
          <Text color={tint} variant="headline">
            {detail}
          </Text>
        ) : null}
      </View>
      {fraction !== undefined && (
        <View
          accessibilityRole="progressbar"
          accessibilityValue={{
            min: 0,
            max: 100,
            now: Math.round(fraction * 100),
          }}
          style={styles.track}>
          <View
            style={[
              styles.fill,
              {backgroundColor: color[tint], width: `${fraction * 100}%`},
            ]}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {gap: space[8]},
  labels: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: space[8],
  },
  label: {flexShrink: 1},
  track: {
    height: 14,
    backgroundColor: `${color.bg}33`,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  fill: {height: '100%', borderRadius: radius.pill},
});

export default TimerContainer;
