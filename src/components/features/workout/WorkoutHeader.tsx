import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {colors} from '../../../constants/colors';

interface WorkoutHeaderProps {
  setNumber: number; // 1-based
  totalSets: number;
  target: {reps: number; isMax: boolean};
}

function WorkoutHeader({setNumber, totalSets, target}: WorkoutHeaderProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.set}>
        세트 {setNumber} / {totalSets}
      </Text>
      <Text style={styles.target}>
        {target.isMax ? `최소 ${target.reps}회, 가능한 만큼` : `목표 ${target.reps}회`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {alignItems: 'center', gap: 4, marginBottom: 32},
  set: {fontSize: 26, fontWeight: 'bold', color: colors.textSecondary},
  target: {fontSize: 15, color: colors.gray400},
});

export default WorkoutHeader;
