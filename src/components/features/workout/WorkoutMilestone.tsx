import React, {useEffect, useState} from 'react';
import {StyleSheet, View} from 'react-native';
import {color, radius, space} from '../../../theme';
import {Icon} from '../../ui/Icon';
import {Text} from '../../ui/Text';

type Milestone = {
  reps: number;
  previousBest?: number;
  goal?: number;
  autoFinish?: boolean;
};

export function useWorkoutMilestone() {
  const [milestone, showMilestone] = useState<Milestone | null>(null);
  useEffect(() => {
    if (!milestone) {
      return;
    }
    const timer = setTimeout(
      () => showMilestone(null),
      milestone.previousBest === undefined ? 650 : 1000,
    );
    return () => clearTimeout(timer);
  }, [milestone]);

  return {milestone, showMilestone};
}

export function WorkoutMilestone({milestone}: {milestone: Milestone}) {
  const record = milestone.previousBest !== undefined;
  const goalLabel = `${milestone.goal}개 달성`;
  const title = record ? '최고 기록!' : goalLabel;
  const next = milestone.autoFinish ? '곧 휴식으로 넘어가요' : undefined;
  return (
    <View
      pointerEvents="none"
      accessibilityLiveRegion="polite"
      style={[styles.overlay, record && styles.record]}>
      <View style={styles.icon}>
        <Icon
          name={record ? 'trophy' : 'circle-check'}
          color="onAccent"
          size={28}
        />
      </View>
      <Text variant="title" color="onAccent">
        {title}
      </Text>
      {record && (
        <Text color="onAccent" weight={700}>
          {milestone.reps}개 · 이전 {milestone.previousBest}개
        </Text>
      )}
      {record && milestone.goal !== undefined && (
        <Text color="onAccent">{goalLabel}</Text>
      )}
      {next && <Text color="onAccent">{next}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: color.active,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space[8],
  },
  record: {backgroundColor: color.record},
  icon: {
    padding: space[12],
    borderRadius: radius.pill,
    backgroundColor: `${color.bg}1F`,
  },
});
