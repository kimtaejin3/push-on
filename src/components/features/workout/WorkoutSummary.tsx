import React from 'react';
import {SafeAreaView} from 'react-native-safe-area-context';
import {ScrollView, StyleSheet, Text, View} from 'react-native';
import CustomButton from '../../common/CustomButton';
import {colors} from '../../../constants/colors';
import {WorkoutPlan} from '../../../domain/workoutSession';
import {formatTime} from '../../../utils/time';

interface WorkoutSummaryProps {
  plan: WorkoutPlan;
  results: number[];
  totalSeconds: number;
  doneLabel: string;
  onDone: () => void;
}

function WorkoutSummary({plan, results, totalSeconds, doneLabel, onDone}: WorkoutSummaryProps) {
  const total = results.reduce((a, b) => a + b, 0);
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>운동 완료</Text>
        <View style={styles.totals}>
          <View style={styles.totalItem}>
            <Text style={styles.totalNumber}>{total}</Text>
            <Text style={styles.totalLabel}>총 횟수</Text>
          </View>
          <View style={styles.totalItem}>
            <Text style={styles.totalNumber}>{formatTime(totalSeconds)}</Text>
            <Text style={styles.totalLabel}>총 시간</Text>
          </View>
        </View>
        <View style={styles.table}>
          {results.map((reps, i) => {
            const isMax = plan.lastIsMax && i === plan.sets.length - 1;
            return (
              <View key={i} style={styles.row}>
                <Text style={styles.rowLabel}>세트 {i + 1}</Text>
                <Text style={styles.rowValue}>
                  {reps} / {plan.sets[i]}
                  {isMax ? '+' : ''}
                </Text>
              </View>
            );
          })}
        </View>
        <CustomButton title={doneLabel} variant="start" style={styles.button} onPress={onDone} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {flex: 1, backgroundColor: colors.backgroundDark},
  content: {padding: 20, gap: 20},
  title: {fontSize: 28, fontWeight: 'bold', color: colors.textLight, marginTop: 40, textAlign: 'center'},
  totals: {flexDirection: 'row', gap: 12},
  totalItem: {flex: 1, alignItems: 'center', backgroundColor: colors.overlayMedium, padding: 24, borderRadius: 16},
  totalNumber: {fontSize: 28, fontWeight: 'bold', color: colors.textLight},
  totalLabel: {fontSize: 13, color: colors.gray400, marginTop: 4},
  table: {backgroundColor: colors.overlayLight, borderRadius: 16, paddingHorizontal: 20, paddingVertical: 8},
  row: {flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12},
  rowLabel: {fontSize: 16, color: colors.textSecondary},
  rowValue: {fontSize: 16, fontWeight: '600', color: colors.textLight},
  button: {marginTop: 12},
});

export default WorkoutSummary;
