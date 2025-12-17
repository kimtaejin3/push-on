import React, {useMemo} from 'react';
import {View, Text, StyleSheet, Dimensions, ScrollView} from 'react-native';
import {BarChart} from 'react-native-chart-kit';
import {colors} from '../../../constants/colors';
import {
  WeeklyStatsData,
  MonthlyStatsData,
  YearlyStatsData,
} from '../../../remote/pushup';

interface PushupStatsChartProps {
  data: WeeklyStatsData[] | MonthlyStatsData[] | YearlyStatsData[];
  type: 'weekly' | 'monthly' | 'yearly';
  metric: 'reps' | 'sets' | 'duration';
}

const screenWidth = Dimensions.get('window').width;

function PushupStatsChart({data, type, metric}: PushupStatsChartProps) {
  const chartData = useMemo(() => {
    const labels = data.map(item => {
      if (type === 'weekly') {
        const weeklyItem = item as WeeklyStatsData;
        const date = new Date(weeklyItem.date);
        return `${date.getMonth() + 1}/${date.getDate()}`;
      } else if (type === 'monthly') {
        // 월간 데이터는 주별로 표시 (예: "1/1-1/7")
        const monthlyItem = item as MonthlyStatsData;
        const [startDate, endDate] = monthlyItem.date.split('_');
        const start = new Date(startDate);
        const end = new Date(endDate);
        return `${start.getMonth() + 1}/${start.getDate()}-${
          end.getMonth() + 1
        }/${end.getDate()}`;
      } else {
        // 연간 데이터는 월별로 표시 (예: "1월", "2월")
        const yearlyItem = item as YearlyStatsData;
        const [, month] = yearlyItem.month.split('-');
        return `${parseInt(month, 10)}월`;
      }
    });

    const values = data.map(item => {
      switch (metric) {
        case 'reps':
          return item.totalReps;
        case 'sets':
          return item.totalSets;
        case 'duration':
          return Math.round(item.totalDuration / 60);
        default:
          return 0;
      }
    });

    return {
      labels,
      datasets: [
        {
          data: values,
          color: (opacity = 1) => `rgba(91, 63, 255, ${opacity})`,
          strokeWidth: 2,
        },
      ],
    };
  }, [data, type, metric]);

  const getMetricLabel = () => {
    switch (metric) {
      case 'reps':
        return '푸쉬업 수';
      case 'sets':
        return '세트 수';
      case 'duration':
        return '운동 시간 (분)';
      default:
        return '';
    }
  };

  const getMetricSuffix = () => {
    switch (metric) {
      case 'reps':
        return '번';
      case 'sets':
        return '세트';
      case 'duration':
        return '분';
      default:
        return '';
    }
  };

  const maxValue = Math.max(...chartData.datasets[0].data);
  const yAxisSuffix = getMetricSuffix();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {type === 'weekly' ? '주간' : type === 'monthly' ? '월간' : '연간'}{' '}
          {getMetricLabel()} 통계
        </Text>
      </View>

      <View style={styles.chartContainer}>
        <ScrollView
          horizontal={true}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}>
          <BarChart
            data={chartData}
            width={screenWidth - 10}
            height={350}
            yAxisLabel=""
            yAxisSuffix={yAxisSuffix}
            chartConfig={{
              backgroundGradientFrom: colors.backgroundDark,
              backgroundGradientTo: colors.backgroundDark,
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(91, 63, 255, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
              style: {
                borderRadius: 16,
              },
              propsForLabels: {
                fontSize: 12,
                fill: colors.textLight,
              },
              propsForHorizontalLabels: {
                fontSize: 12,
                fill: colors.textLight,
              },
              propsForDots: {
                r: '6',
                strokeWidth: '2',
                stroke: colors.primaryDark,
              },
              propsForBackgroundLines: {
                strokeWidth: 0,
              },
              barPercentage: 0.7,
              fillShadowGradient: colors.primaryDark,
              fillShadowGradientOpacity: 0.3,
            }}
            style={styles.chart}
            fromZero={true}
            withInnerLines={true}
            withHorizontalLabels={true}
            withVerticalLabels={true}
            segments={2}
            showValuesOnTopOfBars={true}
          />
        </ScrollView>
      </View>

      <View style={styles.summary}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>총 {getMetricLabel()}</Text>
          <Text style={styles.summaryValue}>
            {chartData.datasets[0].data.reduce((sum, value) => sum + value, 0)}
            {yAxisSuffix}
          </Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>평균</Text>
          <Text style={styles.summaryValue}>
            {Math.round(
              chartData.datasets[0].data.reduce(
                (sum, value) => sum + value,
                0,
              ) / chartData.datasets[0].data.length,
            )}
            {yAxisSuffix}
          </Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>최고</Text>
          <Text style={styles.summaryValue}>
            {maxValue}
            {yAxisSuffix}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    marginVertical: 10,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textLight,
    textAlign: 'center',
  },
  chartContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  scrollContent: {
    alignItems: 'center',
  },
  chart: {
    borderRadius: 16,
  },
  summary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: colors.overlayLight,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textLight,
  },
});

export default PushupStatsChart;
