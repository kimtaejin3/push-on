import React, {useCallback, useEffect, useRef, useState} from 'react';
import {Pressable, ScrollView, StyleSheet, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {useQuery, useQueryClient} from '@tanstack/react-query';
import {
  DotCalendar,
  type CalendarActivity,
} from '../components/features/history/DotCalendar';
import {DaySheet} from '../components/features/history/DaySheet';
import {mergePendingSets} from '../components/features/history/historySets';
import {
  CachedAt,
  PeriodStats,
  historyKey,
} from '../components/features/history/PeriodStats';
import {WeeklyBars} from '../components/features/history/WeeklyBars';
import {Card} from '../components/ui/Card';
import {MonthSummaryCard} from '../components/features/history/MonthSummaryCard';
import {Icon} from '../components/ui/Icon';
import {Text} from '../components/ui/Text';
import {useTabBarInset} from '../components/ui/TabBar';
import {EmptyState} from '../components/ui/feedback/EmptyState';
import {ErrorState} from '../components/ui/feedback/ErrorState';
import {Skeleton} from '../components/ui/feedback/Skeleton';
import {useToast} from '../components/ui/feedback/ToastProvider';
import {monthSummary, weeklyTotals} from '../domain/historySummary';
import {addDays} from '../domain/streak';
import {useNow} from '../hooks/useNow';
import {useOnline} from '../hooks/useOnline';
import {useSession} from '../hooks/useSession';
import {useWorkoutDates} from '../hooks/useStreak';
import {getSetsInRange} from '../remote/pushup';
import {loadPendingSaves} from '../utils/pendingSaves';
import {formatKSTDate} from '../utils/time';
import {color, layout, space} from '../theme';

function shiftMonth(date: string, offset: number) {
  const month = new Date(date);
  month.setUTCMonth(month.getUTCMonth() + offset, 1);
  return month.toISOString().slice(0, 10);
}

function useHistoryRange(userId: string, start: string, end: string) {
  return useQuery({
    queryKey: [...historyKey, 'sets', userId, start, end],
    queryFn: () => getSetsInRange(start, end),
    enabled: !!userId,
  });
}

function HistorySkeleton() {
  return (
    <View
      accessible
      accessibilityLabel="기록을 불러오는 중"
      style={styles.skeleton}>
      <Card>
        <Skeleton width={96} height={12} />
        <Skeleton width={200} height={24} />
        <Skeleton width="fill" height={12} />
        <Skeleton width="fill" height={48} radius={12} />
      </Card>
      {Array.from({length: 5}, (_, row) => (
        <View key={row} style={styles.skeletonRow}>
          {Array.from({length: 7}, (__, column) => (
            <Skeleton key={column} width={28} height={28} radius={14} />
          ))}
        </View>
      ))}
      <View style={styles.skeletonBars}>
        {[60, 72, 84, 96, 90, 70].map(height => (
          <View key={height} style={styles.metric}>
            <Skeleton width="fill" height={height} />
          </View>
        ))}
      </View>
    </View>
  );
}

export default function HistoryScreen() {
  const navigation = useNavigation();
  const toast = useToast();
  const tabInset = useTabBarInset();
  const {user} = useSession();
  const userId = user?.id ?? '';
  const online = useOnline();
  const queryClient = useQueryClient();
  const wasOffline = useRef(false);
  const {now, refresh} = useNow();
  useFocusEffect(useCallback(() => refresh(), [refresh]));

  useEffect(() => {
    if (online === true && wasOffline.current) {
      queryClient.refetchQueries({queryKey: historyKey, type: 'active'});
    }
    wasOffline.current = online === false;
  }, [online, queryClient]);

  const today = formatKSTDate(now);
  const joined = user?.created_at
    ? formatKSTDate(new Date(user.created_at))
    : '';
  const thisMonth = shiftMonth(today, 0);
  const [viewedMonth, setViewedMonth] = useState<string>();
  const month = viewedMonth ?? thisMonth;
  const [selectedDate, setSelectedDate] = useState<string>();
  const previousMonth = shiftMonth(month, -1);
  const monthEnd = addDays(shiftMonth(month, 1), -1);
  const weekStart = weeklyTotals([], today)[0].weekStart;

  const dates = useWorkoutDates();
  const current = useHistoryRange(userId, month, monthEnd);
  const previous = useHistoryRange(userId, previousMonth, addDays(month, -1));
  const recent = useHistoryRange(userId, weekStart, today);
  const pending = useQuery({
    queryKey: [...historyKey, 'pending', userId],
    queryFn: async () =>
      (await loadPendingSaves()).filter(item => item.userId === userId),
    enabled: !!userId,
    networkMode: 'always',
  });

  const currentMonth = mergePendingSets(
    current.data ?? [],
    pending.data ?? [],
    month,
    monthEnd,
  );
  const previousSets = mergePendingSets(
    previous.data ?? [],
    pending.data ?? [],
    previousMonth,
    addDays(month, -1),
  ).sets;
  const recentSets = mergePendingSets(
    recent.data ?? [],
    pending.data ?? [],
    weekStart,
    today,
  ).sets;
  const summary = monthSummary(currentMonth.sets, previousSets);
  const previousSummary = monthSummary(previousSets, []);
  const activity = new Map<string, CalendarActivity>();
  const pendingDates = new Set(
    currentMonth.unsent.map(set => set.workout_date),
  );
  let bestSet = -1;
  let bestDate: string | undefined;
  for (const set of currentMonth.sets) {
    const date = set.workout_date;
    activity.set(date, {
      total: (activity.get(date)?.total ?? 0) + set.reps,
      pending: pendingDates.has(date),
    });
    if (set.reps > bestSet) {
      bestSet = set.reps;
      bestDate = date;
    }
  }

  const weeks = weeklyTotals(
    recentSets.map(set => ({
      date: set.workout_date,
      totalReps: set.reps,
    })),
    today,
  );
  const currentMonday = weeks[weeks.length - 1].weekStart;
  const workoutsThisWeek = new Set(
    recentSets
      .filter(set => set.workout_date >= currentMonday)
      .map(set => set.workout_id ?? set.id),
  ).size;
  const firstVisit =
    dates?.length === 0 &&
    currentMonth.sets.length === 0 &&
    previousSets.length === 0 &&
    recentSets.length === 0;
  const firstDay =
    activity.size === 1 && dates?.length === 1 && activity.has(dates[0]);
  const [year, monthNumber] = month.split('-').map(Number);
  const canGoBack = !!joined && month > shiftMonth(joined, 0);
  const canGoForward = month < thisMonth;

  const selectDate = (date: string) => {
    if (date > today || date < joined) {
      toast.show('아직 오지 않은 날이에요');
    } else {
      setSelectedDate(date);
    }
  };
  const closeDay = useCallback(() => setSelectedDate(undefined), []);
  const cached =
    current.data !== undefined && (online === false || current.isRefetchError);
  const localOnly = current.isLoadingError && currentMonth.unsent.length > 0;
  const retry = () => {
    current.refetch();
    previous.refetch();
    recent.refetch();
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.screen}>
      {cached || localOnly ? (
        <View style={styles.offline} accessibilityRole="alert">
          <Icon name="wifi-off" size={16} color="record" />
          <Text
            variant="caption"
            color="record"
            weight={700}
            style={styles.offlineLabel}>
            {cached
              ? '오프라인이에요. 마지막으로 불러온 기록을 보여 드려요'
              : '아직 저장하지 못한 운동을 보여 드려요'}
          </Text>
        </View>
      ) : null}
      <ScrollView
        contentContainerStyle={[styles.content, {paddingBottom: tabInset}]}>
        <View style={styles.header}>
          <Text variant="title">기록</Text>
          <View style={styles.monthNav}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="이전 달"
              accessibilityState={{disabled: !canGoBack}}
              disabled={!canGoBack}
              onPress={() => setViewedMonth(previousMonth)}
              style={[styles.monthButton, !canGoBack && styles.disabled]}>
              <Icon name="chevron-left" />
            </Pressable>
            <Text weight={700} style={styles.monthLabel}>
              {year}년 {monthNumber}월
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="다음 달"
              accessibilityState={{disabled: !canGoForward}}
              disabled={!canGoForward}
              onPress={() => {
                const next = shiftMonth(month, 1);
                setViewedMonth(next === thisMonth ? undefined : next);
              }}
              style={[styles.monthButton, !canGoForward && styles.disabled]}>
              <Icon name="chevron-right" />
            </Pressable>
          </View>
        </View>
        {current.isPending ? (
          <HistorySkeleton />
        ) : current.isLoadingError && !localOnly ? (
          <ErrorState
            title="기록을 불러오지 못했어요"
            message={
              '연결을 확인하고 다시 시도해 주세요.\n운동 기록은 지워지지 않았어요.'
            }
            actionLabel="다시 시도"
            onAction={retry}
          />
        ) : (
          <>
            <View style={styles.summary}>
              {firstVisit ? (
                <EmptyState
                  title="첫 기록을 남겨 보세요"
                  message={
                    '한 번에 몇 개 하는지 재면\n오늘 칸에 첫 점이 찍혀요.'
                  }
                  actionLabel="한 번에 몇 개? 재기"
                  onAction={() => navigation.navigate('Challenge')}
                />
              ) : (
                <MonthSummaryCard
                  summary={summary}
                  previous={previousSummary}
                  previousMonth={Number(previousMonth.slice(5, 7))}
                  firstDay={firstDay}
                  comparisonReady={previous.data !== undefined}
                  onPrevious={() => setViewedMonth(previousMonth)}
                  onRetryComparison={
                    previous.isLoadingError
                      ? () => previous.refetch()
                      : undefined
                  }
                />
              )}
              {cached ? <CachedAt timestamp={current.dataUpdatedAt} /> : null}
            </View>
            <DotCalendar
              monthStart={month}
              monthEnd={monthEnd}
              today={today}
              joined={joined}
              activity={activity}
              bestDate={bestDate}
              onSelectDate={selectDate}
            />
            {!firstVisit ? (
              recent.isPending ? (
                <Skeleton width="fill" height={192} />
              ) : recent.isLoadingError && recentSets.length === 0 ? (
                <ErrorState
                  title="주간 기록을 불러오지 못했어요"
                  actionLabel="다시 시도"
                  onAction={() => recent.refetch()}
                />
              ) : (
                <WeeklyBars weeks={weeks} workoutsThisWeek={workoutsThisWeek} />
              )
            ) : null}
          </>
        )}
        <PeriodStats userId={userId} today={today} />
      </ScrollView>
      {selectedDate ? (
        <DaySheet
          date={selectedDate}
          sets={currentMonth.sets.filter(
            set => set.workout_date === selectedDate,
          )}
          pendingCount={
            currentMonth.unsent.filter(set => set.workout_date === selectedDate)
              .length
          }
          onClose={closeDay}
        />
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: color.bg},
  content: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: space[4],
    gap: 28,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space[4],
  },
  monthNav: {flexDirection: 'row', alignItems: 'center', flexShrink: 1},
  monthButton: {
    width: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthLabel: {flexShrink: 1, textAlign: 'center'},
  disabled: {opacity: 0.4},
  offline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[8],
    backgroundColor: color.offlineBar,
    paddingHorizontal: layout.screenPadding,
    paddingVertical: space[8],
  },
  offlineLabel: {flex: 1},
  summary: {gap: space[8]},
  metric: {flex: 1, gap: 2},
  skeleton: {gap: space[16]},
  skeletonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    minHeight: 32,
  },
  skeletonBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: space[12],
    marginTop: space[32],
  },
});
