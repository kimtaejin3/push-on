import React, {useState} from 'react';
import {ScrollView, StyleSheet, View} from 'react-native';
import {useQuery} from '@tanstack/react-query';
import {
  processMonthlyStats,
  processWeeklyStats,
  processYearlyStats,
} from '../../../remote/pushup';
import {pushupStatsQueryOptions} from '../../../tanstack-query';
import {queryKeys} from '../../../tanstack-query/queryKeys';
import {space} from '../../../theme';
import {formatTimeKorean, formatTimeWithHours} from '../../../utils/time';
import {EmptyState} from '../../ui/feedback/EmptyState';
import {ErrorState} from '../../ui/feedback/ErrorState';
import {Skeleton} from '../../ui/feedback/Skeleton';
import {SegmentedControl} from '../../ui/SegmentedControl';
import {Text} from '../../ui/Text';
import {HistoryBars, shortDate} from './WeeklyBars';

export const historyKey = [...queryKeys.pushup.all, 'history'] as const;

const periods = [
  {key: 'weekly', label: '주'},
  {key: 'monthly', label: '월'},
  {key: 'yearly', label: '연'},
];

const metrics = [
  {key: 'totalReps', label: '개수'},
  {key: 'totalSets', label: '세트'},
  {key: 'totalDuration', label: '시간'},
];

const cacheTimeFormat = new Intl.DateTimeFormat('ko-KR', {
  hour: 'numeric',
  minute: '2-digit',
});

export function CachedAt({timestamp}: {timestamp: number}) {
  return (
    <Text variant="caption" color="textMuted">
      {cacheTimeFormat.format(new Date(timestamp))}에 불러온 기록 · 연결되면
      새로 고쳐요
    </Text>
  );
}

export function PeriodStats({userId, today}: {userId: string; today: string}) {
  const [period, setPeriod] = useState('weekly');
  const [metric, setMetric] = useState('totalReps');
  const days = period === 'yearly' ? 365 : 30;
  const query = useQuery({
    ...pushupStatsQueryOptions(days),
    queryKey: [...historyKey, 'stats', days, userId, today],
    enabled: !!userId,
  });

  const data = query.data ?? [];
  let buckets;
  switch (period) {
    case 'yearly':
      buckets = processYearlyStats(data).map(row => ({
        ...row,
        label: `${Number(row.month.slice(-2))}월`,
      }));
      break;
    case 'monthly':
      buckets = processMonthlyStats(data).map(row => {
        const [start, end] = row.date.split('_');
        return {...row, label: `${shortDate(start)}–${shortDate(end)}`};
      });
      break;
    default:
      buckets = processWeeklyStats(data).map(row => ({
        ...row,
        label: shortDate(row.date),
      }));
  }

  const bars = buckets.map(row => {
    if (metric === 'totalDuration') {
      return {
        label: row.label,
        value: row.totalDuration,
        valueLabel: formatTimeWithHours(row.totalDuration),
        accessibilityValue: formatTimeKorean(row.totalDuration),
      };
    }
    const showSets = metric === 'totalSets';
    const value = showSets ? row.totalSets : row.totalReps;
    return {
      label: row.label,
      value,
      accessibilityValue: `${value}${showSets ? '세트' : '개'}`,
    };
  });

  return (
    <View style={styles.section}>
      <Text variant="headline" weight={800}>
        기간별 통계
      </Text>
      <SegmentedControl options={periods} value={period} onChange={setPeriod} />
      <SegmentedControl options={metrics} value={metric} onChange={setMetric} />
      {query.isPending ? (
        <Skeleton width="fill" height={192} />
      ) : query.isLoadingError ? (
        <ErrorState
          title="통계를 불러오지 못했어요"
          actionLabel="다시 시도"
          onAction={() => query.refetch()}
        />
      ) : (
        <>
          {buckets.some(row => row.totalSets > 0) ? (
            period === 'yearly' ? (
              <ScrollView horizontal contentContainerStyle={styles.yearly}>
                <View style={styles.yearlyChart}>
                  <HistoryBars bars={bars} />
                </View>
              </ScrollView>
            ) : (
              <HistoryBars bars={bars} />
            )
          ) : (
            <EmptyState title="이 기간의 운동 기록이 없어요" />
          )}
          {query.isRefetchError ? (
            <CachedAt timestamp={query.dataUpdatedAt} />
          ) : null}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {gap: space[12]},
  yearly: {paddingBottom: space[8]},
  yearlyChart: {width: 660},
});
