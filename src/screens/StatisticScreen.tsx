import React, {useState, useMemo} from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useQuery} from '@tanstack/react-query';
import {colors} from '../constants/colors';
import PushupStatsChart from '../components/features/push-up/PushupStatsChart';
import {
  pushupStatsQueryOptions,
  processWeeklyStats,
  processMonthlyStats,
} from '../tanstack-query';
import { processYearlyStats } from '../remote/pushup';
import {filterByMode, STAT_MODE_FILTERS, StatModeFilter} from '../domain/stats';

type TimePeriod = 'weekly' | 'monthly' | 'yearly';
type MetricType = 'reps' | 'sets' | 'duration';

function StatisticScreen() {
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('weekly');
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('reps');
  const [selectedMode, setSelectedMode] = useState<StatModeFilter>('all');

  // 30일 raw 데이터를 한 번만 가져오기 (최적화)
  const {data: rawData, isLoading} = useQuery(pushupStatsQueryOptions(30));

  const {data: yearlyRawData, isLoading: isLoadingYearly} = useQuery({
    ...pushupStatsQueryOptions(365),
    enabled: selectedPeriod === 'yearly',
  });

  // 클라이언트에서 주간/월간 데이터로 가공
  // 모드 필터를 거친 raw 데이터
  const filteredRaw = useMemo(
    () => (rawData ? filterByMode(rawData, selectedMode) : null),
    [rawData, selectedMode],
  );
  const filteredYearlyRaw = useMemo(
    () => (yearlyRawData ? filterByMode(yearlyRawData, selectedMode) : null),
    [yearlyRawData, selectedMode],
  );

  const weeklyData = useMemo(() => {
    if (!filteredRaw) {
      return [];
    }
    return processWeeklyStats(filteredRaw);
  }, [filteredRaw]);

  const monthlyData = useMemo(() => {
    if (!filteredRaw) {
      return [];
    }
    return processMonthlyStats(filteredRaw);
  }, [filteredRaw]);

  const yearlyData = useMemo(() => {
    if (!filteredYearlyRaw) {
      return [];
    }
    return processYearlyStats(filteredYearlyRaw);
  }, [filteredYearlyRaw]);

  const currentData =
    selectedPeriod === 'weekly'
      ? weeklyData
      : selectedPeriod === 'monthly'
        ? monthlyData
        : yearlyData;

  const periodButtons = [
    {key: 'weekly' as TimePeriod, label: '주간'},
    {key: 'monthly' as TimePeriod, label: '월간'},
    {key: 'yearly' as TimePeriod, label: '연간'},
  ];

  const metricButtons = [
    {key: 'reps' as MetricType, label: '푸쉬업 수'},
    {key: 'sets' as MetricType, label: '세트 수'},
    {key: 'duration' as MetricType, label: '운동 시간'},
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          {/* 기간 선택 버튼 */}
          <View style={styles.periodSelector}>
            {periodButtons.map(button => (
              <TouchableOpacity
                key={button.key}
                style={[
                  styles.periodButton,
                  selectedPeriod === button.key && styles.periodButtonActive,
                ]}
                onPress={() => setSelectedPeriod(button.key)}>
                <Text
                  style={[
                    styles.periodButtonText,
                    selectedPeriod === button.key &&
                      styles.periodButtonTextActive,
                  ]}>
                  {button.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* 모드 필터 칩 */}
          <View style={styles.modeChips}>
            {STAT_MODE_FILTERS.map(filter => (
              <TouchableOpacity
                key={filter.key}
                style={[
                  styles.modeChip,
                  selectedMode === filter.key && styles.modeChipActive,
                ]}
                onPress={() => setSelectedMode(filter.key)}>
                <Text
                  style={[
                    styles.modeChipText,
                    selectedMode === filter.key && styles.modeChipTextActive,
                  ]}>
                  {filter.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* 메트릭 선택 버튼 */}
          <View style={styles.metricSelector}>
            {metricButtons.map(button => (
              <TouchableOpacity
                key={button.key}
                style={[
                  styles.metricButton,
                  selectedMetric === button.key && styles.metricButtonActive,
                ]}
                onPress={() => setSelectedMetric(button.key)}>
                <Text
                  style={[
                    styles.metricButtonText,
                    selectedMetric === button.key &&
                      styles.metricButtonTextActive,
                  ]}>
                  {button.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* 차트 */}
          {isLoading || isLoadingYearly ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>데이터를 불러오는 중...</Text>
            </View>
          ) : currentData && currentData.length > 0 ? (
            <PushupStatsChart
              data={currentData}
              type={selectedPeriod}
              metric={selectedMetric}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {selectedPeriod === 'weekly'
                  ? '주간'
                  : selectedPeriod === 'monthly'
                    ? '월간'
                    : '연간'}{' '}
                데이터가 없습니다.
              </Text>
              <Text style={styles.emptySubText}>푸쉬업을 시작해보세요!</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.backgroundDark,
  },
  scrollView: {
    flex: 1,
  },
  container: {
    padding: 20,
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: colors.overlayLight,
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: colors.primaryDark,
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  periodButtonTextActive: {
    color: colors.textLight,
  },
  modeChips: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  modeChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: colors.overlayLight,
  },
  modeChipActive: {
    backgroundColor: colors.primary,
  },
  modeChipText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  modeChipTextActive: {
    color: colors.textLight,
    fontWeight: '600',
  },
  metricSelector: {
    flexDirection: 'row',
    backgroundColor: colors.overlayLight,
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  metricButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  metricButtonActive: {
    backgroundColor: colors.primaryDark,
  },
  metricButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  metricButtonTextActive: {
    color: colors.textLight,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.textSecondary,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    backgroundColor: colors.overlayLight,
    borderRadius: 16,
    marginVertical: 10,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textLight,
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
});

export default StatisticScreen;
