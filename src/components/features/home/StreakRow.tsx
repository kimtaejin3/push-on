import React from 'react';
import {Pressable, ScrollView, StyleSheet, View} from 'react-native';
import type {StreakState} from '../../../domain/streak';
import {streakBanner} from '../../../domain/streakMessages';
import {space} from '../../../theme';
import {Icon, StreakDay, Text} from '../../ui';

const weekdays = ['월', '화', '수', '목', '금', '토', '일'];

interface StreakRowProps {
  streak: StreakState;
  hour: number;
  onPress: () => void;
}

export function StreakRow({streak, hour, onPress}: StreakRowProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityHint="스트릭 보기"
      onPress={onPress}
      style={({pressed}) => [styles.row, pressed && styles.pressed]}>
      <View style={styles.header}>
        <Text weight={700}>{streak.current}일 연속</Text>
        <View style={styles.banner}>
          <Icon name="calendar-check" size={16} color="record" />
          <Text
            variant="label"
            weight={700}
            color="record"
            style={styles.message}>
            {streakBanner(streak, hour)}
          </Text>
        </View>
      </View>
      <ScrollView
        horizontal
        contentContainerStyle={styles.week}
        showsHorizontalScrollIndicator={false}>
        {streak.week.map(({date, mark}, index) => (
          <StreakDay key={date} label={weekdays[index]} mark={mark} />
        ))}
      </ScrollView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {gap: 14},
  pressed: {opacity: 0.7},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space[8],
  },
  banner: {flexDirection: 'row', alignItems: 'center', flexShrink: 1, gap: 6},
  message: {flexShrink: 1},
  week: {flexGrow: 1, justifyContent: 'space-between'},
});
