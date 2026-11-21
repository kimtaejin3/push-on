import React from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import {
  monthSummaryLine,
  type MonthSummary,
} from '../../../domain/historySummary';
import {layout, space} from '../../../theme';
import {Card} from '../../ui/Card';
import {Icon} from '../../ui/Icon';
import {Text} from '../../ui/Text';

interface Props {
  summary: MonthSummary;
  previous: MonthSummary;
  previousMonth: number;
  firstDay: boolean;
  comparisonReady: boolean;
  onPrevious: () => void;
  onRetryComparison?: () => void;
}

export function MonthSummaryCard({
  summary,
  previous,
  previousMonth,
  firstDay,
  comparisonReady,
  onPrevious,
  onRetryComparison,
}: Props) {
  const hasActivity = summary.activeDays > 0;
  const showPrevious = !hasActivity && previous.activeDays > 0;
  let conclusion = monthSummaryLine(summary);
  if (firstDay) {
    conclusion = `첫 운동 ${summary.total}개.\n다음 운동부터 비교해 드려요`;
  } else if (showPrevious) {
    conclusion = '이번 달은 아직 없어요';
  } else if (!comparisonReady && hasActivity) {
    conclusion = `이번 달 ${summary.activeDays}일 운동했어요`;
  }

  return (
    <Card style={styles.card}>
      <Text variant="caption" color="textMuted" weight={700}>
        {firstDay ? '첫 기록' : '이번 달 한 줄 요약'}
      </Text>
      <Text variant="headline" weight={800}>
        {conclusion}
      </Text>
      {hasActivity ? (
        <View style={styles.metrics}>
          {[
            {
              label: '총 개수',
              value: summary.total,
              unit: '개',
              tint: 'text' as const,
            },
            {
              label: '운동한 날',
              value: summary.activeDays,
              unit: '일',
              tint: 'text' as const,
            },
            {
              label: '한 세트 최고',
              value: summary.bestSet,
              unit: '개',
              tint: 'record' as const,
            },
          ].map(({label, value, unit, tint}) => (
            <View key={label} style={styles.metric}>
              <Text variant="caption" color="textMuted" weight={600}>
                {label}
              </Text>
              <View style={styles.value}>
                <Text numeric weight={800} color={tint} style={styles.number}>
                  {value.toLocaleString('ko-KR')}
                </Text>
                <Text variant="label" weight={700} color={tint}>
                  {unit}
                </Text>
              </View>
            </View>
          ))}
        </View>
      ) : null}
      {showPrevious ? (
        <View style={styles.previous}>
          <Text variant="label" color="textMuted">
            지난달 {previous.total.toLocaleString('ko-KR')}개 ·{' '}
            {previous.activeDays}일 운동했어요
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={onPrevious}
            style={styles.link}>
            <Text variant="label" color="active" weight={700}>
              {previousMonth}월 기록 보기
            </Text>
            <Icon name="chevron-right" size={16} color="active" />
          </Pressable>
        </View>
      ) : null}
      {onRetryComparison ? (
        <Pressable
          accessibilityRole="button"
          onPress={onRetryComparison}
          style={styles.link}>
          <Text variant="label" color="active">
            지난달 기록 다시 불러오기
          </Text>
        </Pressable>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {gap: space[16]},
  metrics: {flexDirection: 'row', gap: space[8]},
  metric: {flex: 1, gap: 2},
  value: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
    columnGap: 2,
  },
  number: {fontSize: 32, lineHeight: 30},
  previous: {gap: space[4]},
  link: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: layout.touchMin,
    gap: space[4],
  },
});
