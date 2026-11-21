import React from 'react';
import {StyleSheet, View} from 'react-native';
import type {StreakState} from '../../../domain/streak';
import {space} from '../../../theme';
import {StreakDay} from '../../ui/StreakDay';

// week 는 늘 월요일부터 7칸이다
const DAY_LABELS = ['월', '화', '수', '목', '금', '토', '일'];

interface WeekDotsProps {
  week: StreakState['week'];
}

function WeekDots({week}: WeekDotsProps) {
  return (
    <View style={styles.row}>
      {week.map(({date, mark}, i) => (
        <StreakDay key={date} label={DAY_LABELS[i]} mark={mark} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: space[8],
  },
});

export default WeekDots;
