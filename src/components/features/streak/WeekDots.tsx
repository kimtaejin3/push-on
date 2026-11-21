import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import {colors} from '../../../constants/colors';
import type {DayMark, StreakState} from '../../../domain/streak';

// week 는 늘 월요일부터 7칸이다
const DAY_LABELS = ['월', '화', '수', '목', '금', '토', '일'];

const MARK_LABELS: Record<DayMark, string> = {
  done: '함',
  frozen: '보호됨',
  missed: '안 함',
  today: '오늘',
  future: '아직 안 온 날',
};

interface WeekDotsProps {
  week: StreakState['week'];
}

/** 이번 주 월~일 7칸. 스트릭 화면과 축하 화면이 함께 쓴다 (props 만 받는다) */
function WeekDots({week}: WeekDotsProps) {
  return (
    <View style={styles.row}>
      {week.map(({date, mark}, i) => (
        <View
          key={date}
          style={styles.day}
          accessible
          accessibilityLabel={`${DAY_LABELS[i]}요일 ${MARK_LABELS[mark]}`}>
          <Text style={[styles.label, mark === 'today' && styles.labelToday]}>
            {DAY_LABELS[i]}
          </Text>
          <View style={[styles.dot, dotStyles[mark]]}>
            {mark === 'done' && (
              <FontAwesome6 name="check" size={14} color={colors.textLight} iconStyle="solid" />
            )}
            {mark === 'frozen' && (
              <FontAwesome6 name="snowflake" size={14} color={colors.lightBlue} iconStyle="solid" />
            )}
          </View>
        </View>
      ))}
    </View>
  );
}

const DOT_SIZE = 32;

const styles = StyleSheet.create({
  row: {flexDirection: 'row', justifyContent: 'space-between'},
  day: {alignItems: 'center', gap: 8},
  label: {fontSize: 13, color: colors.gray400},
  labelToday: {color: colors.textLight, fontWeight: '600'},
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

const dotStyles = StyleSheet.create<Record<DayMark, object>>({
  done: {backgroundColor: colors.primary},
  frozen: {backgroundColor: 'rgba(88, 168, 245, 0.15)'},
  missed: {backgroundColor: colors.overlayMedium},
  // 오늘은 아직 비어 있지만 채울 수 있는 칸이라 테두리로 표시한다
  today: {borderWidth: 2, borderColor: colors.primary},
  future: {borderWidth: 1, borderColor: colors.overlayMedium},
});

export default WeekDots;
