import React, {useRef, useState} from 'react';
import {ScrollView, StyleSheet, View} from 'react-native';
import {useQuery} from '@tanstack/react-query';
import {dailyBuckets} from '../../../domain/historySummary';
import {processYearlyStats} from '../../../remote/pushup';
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
  const scrollRef = useRef<ScrollView>(null);
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
      // 최근 30일을 하루씩 (예전에는 8일씩 겹치고 빠지는 4주 묶음이었다)
      buckets = dailyBuckets(data, 30, today).map(row => ({
        ...row,
        label: shortDate(row.date),
      }));
      break;
    default:
      buckets = dailyBuckets(data, 7, today).map(row => ({
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
            period !== 'weekly' ? (
              // 막대가 많으면 옆으로 넘겨 본다. 최근 쪽(오른쪽 끝)부터 보여 준다
              <ScrollView
                key={period}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrolling}
                onContentSizeChange={(width: number) =>
                  width > 0 && scrollRef.current?.scrollToEnd({animated: false})
                }
                ref={scrollRef}>
                <View style={period === 'yearly' ? styles.yearlyChart : styles.monthlyChart}>
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
  scrolling: {paddingBottom: space[8]},
  yearlyChart: {width: 660},
  // 하루 막대 30개 — 날짜(11/24)와 값(120)이 들어가는 폭
  monthlyChart: {width: 30 * 44},
});
