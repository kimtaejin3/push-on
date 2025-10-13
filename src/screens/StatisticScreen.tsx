import React, {useState} from 'react';
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
  weeklyPushupStatsQueryOptions,
  monthlyPushupStatsQueryOptions,
} from '../tanstack-query';

type TimePeriod = 'weekly' | 'monthly';
type MetricType = 'reps' | 'sets' | 'duration';

function StatisticScreen() {
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('weekly');
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('reps');

  const {data: weeklyData, isLoading: weeklyLoading} = useQuery(
    weeklyPushupStatsQueryOptions(),
  );
  const {data: monthlyData, isLoading: monthlyLoading} = useQuery(
    monthlyPushupStatsQueryOptions(),
  );

  const currentData = selectedPeriod === 'weekly' ? weeklyData : monthlyData;
  const isLoading =
    selectedPeriod === 'weekly' ? weeklyLoading : monthlyLoading;

  const periodButtons = [
    {key: 'weekly' as TimePeriod, label: '주간'},
    {key: 'monthly' as TimePeriod, label: '월간'},
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
          {isLoading ? (
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
                {selectedPeriod === 'weekly' ? '주간' : '월간'} 데이터가
                없습니다.
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
  metricSelector: {
    flexDirection: 'row',
    backgroundColor: colors.overlayLight,
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
    shadowColor: colors.gray900,
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
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
