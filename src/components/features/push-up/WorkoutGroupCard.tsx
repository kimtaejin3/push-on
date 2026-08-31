import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {colors} from '../../../constants/colors';
import {WorkoutGroup} from '../../../domain/history';
import {formatTime} from '../../../utils/time';

interface WorkoutGroupCardProps {
  group: WorkoutGroup;
}

/** 하루 기록 중 운동 하나(챌린지 1세트 또는 세트/프로그램 여러 세트)를 보여주는 카드 */
function WorkoutGroupCard({group}: WorkoutGroupCardProps) {
  const totalReps = group.sets.reduce((a, s) => a + s.reps, 0);
  const isMulti = group.sets.length > 1;

  // 세트 1개(챌린지/테스트)는 헤더 총합과 행이 같은 숫자라 한 줄로만 보여준다
  if (!isMulti) {
    const set = group.sets[0];
    return (
      <View style={styles.card}>
        <View style={styles.singleRow}>
          <Text style={styles.label}>{group.label}</Text>
          <View style={styles.rowRight}>
            <Text style={styles.rowReps}>
              {set.reps}회
              {set.target_reps ? <Text style={styles.rowTarget}> / {set.target_reps}</Text> : null}
            </Text>
            <Text style={styles.rowTime}>{formatTime(set.duration_seconds)}</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.label}>{group.label}</Text>
        <Text style={styles.total}>{totalReps}회</Text>
      </View>
      {group.sets.map((set, i) => (
        <View key={set.id} style={[styles.row, i === group.sets.length - 1 && styles.lastRow]}>
          <Text style={styles.rowLabel}>{`세트 ${i + 1}`}</Text>
          <View style={styles.rowRight}>
            <Text style={styles.rowReps}>
              {set.reps}회
              {set.target_reps ? <Text style={styles.rowTarget}> / {set.target_reps}</Text> : null}
            </Text>
            <Text style={styles.rowTime}>{formatTime(set.duration_seconds)}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.overlayLight,
    borderRadius: 15,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 10,
  },
  singleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.overlayMedium,
  },
  label: {fontSize: 14, fontWeight: '600', color: colors.primaryLight},
  total: {fontSize: 14, fontWeight: '600', color: colors.textLight},
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
  },
  lastRow: {},
  rowLabel: {fontSize: 14, color: colors.textSecondary},
  rowRight: {flexDirection: 'row', alignItems: 'baseline', gap: 10},
  rowReps: {fontSize: 16, fontWeight: 'bold', color: colors.textLight},
  rowTarget: {fontSize: 13, fontWeight: '400', color: colors.gray400},
  rowTime: {fontSize: 12, color: colors.textSecondary},
});

export default WorkoutGroupCard;
