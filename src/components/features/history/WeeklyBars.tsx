import React from 'react';
import {StyleSheet, View} from 'react-native';
import Svg, {Path} from 'react-native-svg';
import type {weeklyTotals} from '../../../domain/historySummary';
import {color, space} from '../../../theme';
import {Text} from '../../ui/Text';

export const shortDate = (date: string) =>
  `${Number(date.slice(5, 7))}/${Number(date.slice(8, 10))}`;

interface Bar {
  label: string;
  value: number;
  valueLabel?: string;
  accessibilityValue?: string;
}

export function HistoryBars({bars}: {bars: Bar[]}) {
  const peak = Math.max(...bars.map(bar => bar.value));
  const bestIndex = bars.findIndex(bar => bar.value === peak && peak > 0);
  const barMax = bars.filter(bar => bar.value > 0).length === 1 ? 28 : 118;

  return (
    <View style={styles.graph}>
      <View style={styles.bars}>
        {bars.map((bar, index) => {
          const latest = index === bars.length - 1;
          const best = index === bestIndex && !latest;
          const height = peak > 0 ? (bar.value / peak) * barMax : 0;
          const barColor = latest
            ? color.activeFill
            : best
            ? color.record
            : color.quiet;
          const valueColor = latest ? 'active' : best ? 'record' : 'textMuted';
          const corner = Math.min(6, height);
          return (
            <View
              key={bar.label}
              accessible
              accessibilityLabel={`${bar.label}, ${
                bar.accessibilityValue ?? bar.value
              }`}
              style={styles.column}>
              <Text
                variant="label"
                numeric
                weight={800}
                color={height ? valueColor : 'quiet'}
                style={styles.value}>
                {height ? bar.valueLabel ?? bar.value : '–'}
              </Text>
              {height > 0 ? (
                <Svg
                  height={height}
                  width="100%"
                  viewBox={`0 0 48 ${height}`}
                  preserveAspectRatio="none"
                  accessible={false}>
                  <Path
                    fill={barColor}
                    d={`M0 ${height} V${corner} Q0 0 ${corner} 0 H${
                      48 - corner
                    } Q48 0 48 ${corner} V${height} Z`}
                  />
                </Svg>
              ) : null}
            </View>
          );
        })}
      </View>
      <View style={styles.labels}>
        {bars.map((bar, index) => {
          const latest = index === bars.length - 1;
          return (
            <View
              key={bar.label}
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
              style={styles.label}>
              <Text
                variant="caption"
                weight={latest ? 800 : 600}
                color={latest ? 'text' : 'textMuted'}
                style={styles.labelText}>
                {bar.label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

export function WeeklyBars({
  weeks,
  workoutsThisWeek,
}: {
  weeks: ReturnType<typeof weeklyTotals>;
  workoutsThisWeek: number;
}) {
  const current = weeks[weeks.length - 1].total;
  const hasEarlierWeek = weeks.slice(0, -1).some(week => week.total > 0);
  const currentTotal = current.toLocaleString('ko-KR');
  let message = '이번 주 기록은 아직 없어요.';
  if (workoutsThisWeek > 0) {
    message = hasEarlierWeek
      ? `이번 주 ${workoutsThisWeek}번 만에 ${currentTotal}개 했어요.`
      : `이번 주 ${currentTotal}개. 다음 주부터 주간 비교가 보여요.`;
  }

  return (
    <View style={styles.section}>
      <View style={styles.heading}>
        <Text variant="caption" color="textMuted" weight={700}>
          주간 총합
        </Text>
        <Text weight={800} style={styles.message}>
          {message}
        </Text>
      </View>
      <HistoryBars
        bars={weeks.map(({weekStart, total}, index) => ({
          label: index === weeks.length - 1 ? '이번 주' : shortDate(weekStart),
          value: total,
          accessibilityValue: `${total}개`,
        }))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  section: {gap: space[16]},
  heading: {gap: space[4]},
  message: {lineHeight: 23},
  graph: {gap: space[12]},
  bars: {
    minHeight: 169.5,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: space[12],
    borderBottomWidth: 1,
    borderBottomColor: color.border,
  },
  column: {flex: 1, alignItems: 'center', gap: 6},
  value: {fontSize: 18, lineHeight: 22, textAlign: 'center'},
  labels: {flexDirection: 'row', gap: space[12]},
  label: {flex: 1},
  labelText: {fontSize: 12, lineHeight: 16, textAlign: 'center'},
});
