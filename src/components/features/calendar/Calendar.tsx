import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import FontAwesome5 from '@react-native-vector-icons/fontawesome5';
import {colors} from '../../../constants/colors';
import {useCalendarData} from '../../../hooks/useCalendarData';
import {
  usePushupCalendarData,
  PushupDayData,
} from '../../../hooks/usePushupCalendarData';
import CalendarDay from './CalendarDay';

interface CalendarProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  onMonthChange: (year: number, month: number) => void;
}

const Calendar: React.FC<CalendarProps> = ({
  selectedDate,
  onDateSelect,
  onMonthChange,
}) => {
  const calendarData = useCalendarData({selectedDate});
  const {data: pushupData, isLoading} = usePushupCalendarData({
    year: calendarData.year,
    month: calendarData.month + 1,
  });

  const handlePreviousMonth = () => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() - 1);
    onMonthChange(newDate.getFullYear(), newDate.getMonth());
  };

  const handleNextMonth = () => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() + 1);
    onMonthChange(newDate.getFullYear(), newDate.getMonth());
  };

  const getPushupDataForDate = (date: Date): PushupDayData | undefined => {
    if (!pushupData) {
      return undefined;
    }

    const dateStr = date.toISOString().split('T')[0];
    console.log('dateStr', dateStr);
    console.log('pushupData', pushupData);
    return pushupData.find(data => data.date === dateStr);
  };

  const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={styles.loadingText}>달력 데이터를 불러오는 중...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.navButton}
          onPress={handlePreviousMonth}>
          <FontAwesome5
            name="chevron-left"
            size={16}
            color={colors.primary}
            iconStyle="solid"
          />
        </TouchableOpacity>

        <Text style={styles.monthYearText}>
          {calendarData.year}년 {calendarData.monthName}
        </Text>

        <TouchableOpacity style={styles.navButton} onPress={handleNextMonth}>
          <FontAwesome5
            name="chevron-right"
            size={16}
            color={colors.primary}
            iconStyle="solid"
          />
        </TouchableOpacity>
      </View>

      {/* 요일 헤더 */}
      <View style={styles.weekDaysContainer}>
        {weekDays.map((day, index) => (
          <Text key={index} style={styles.weekDayText}>
            {day}
          </Text>
        ))}
      </View>

      {/* 달력 그리드 */}
      <View style={styles.calendarGrid}>
        {calendarData.days.map((day, index) => {
          const checkPushupData = getPushupDataForDate(day.date);
          console.log(
            'checkPushupData',
            checkPushupData,
            'day',
            day.date.toISOString().split('T')[0],
            'dayOfMonth',
            day.dayOfMonth,
          );
          return (
            <CalendarDay
              key={index}
              day={day}
              pushupData={getPushupDataForDate(day.date)}
              onPress={onDateSelect}
            />
          );
        })}
      </View>

      {/* 범례 */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, {backgroundColor: colors.primary}]} />
          <Text style={styles.legendText}>오늘</Text>
        </View>
        <View style={styles.legendItem}>
          <FontAwesome5
            name="check-circle"
            size={12}
            color={colors.primary}
            iconStyle="solid"
          />
          <Text style={styles.legendText}>운동 완료</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.overlayLight,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: colors.overlayLight,
    borderRadius: 16,
    marginBottom: 20,
  },
  loadingText: {
    marginLeft: 8,
    color: colors.textSecondary,
    fontSize: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  navButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.overlayMedium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthYearText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textLight,
  },
  weekDaysContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekDayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
    gap: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});

export default Calendar;
