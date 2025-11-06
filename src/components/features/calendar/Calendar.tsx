import React, {useState} from 'react';
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
import {PushupDayData} from '../../../remote/pushup';
import CalendarDay from './CalendarDay';
import {
  CURRENT_MONTH,
  CURRENT_YEAR,
  updateSelectedDateAtom,
} from '../../../atoms/date';
import {useAtom} from 'jotai';
import {useAuth} from '../../../hooks/useAuth';
import {formatKSTDate} from '../../../utils/time';
import {useQuery} from '@tanstack/react-query';
import {pushupCalendarQueryOptions} from '../../../tanstack-query';

interface CalendarProps {
  selectedDate: Date;
}

const Calendar: React.FC<CalendarProps> = ({selectedDate}) => {
  const calendarData = useCalendarData({selectedDate});
  const {user} = useAuth();
  const {data: pushupData, isLoading} = useQuery(
    pushupCalendarQueryOptions(
      user?.id || '',
      calendarData.year,
      calendarData.month + 1,
    ),
  );
  const [, updateSelectedDate] = useAtom(updateSelectedDateAtom);
  const [isExpanded, setIsExpanded] = useState(true);

  const handleMonthChange = (year: number, month: number) => {
    const newDate = new Date(year, month, 1);
    updateSelectedDate(newDate);
  };

  const handlePreviousMonth = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(1); // 날짜를 1일로 설정하여 월 오버플로우 방지
    newDate.setMonth(newDate.getMonth() - 1);
    handleMonthChange(newDate.getFullYear(), newDate.getMonth());
  };

  const handleNextMonth = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(1); // 날짜를 1일로 설정하여 월 오버플로우 방지
    newDate.setMonth(newDate.getMonth() + 1);
    handleMonthChange(newDate.getFullYear(), newDate.getMonth());
  };

  const getPushupDataForDate = (date: Date): PushupDayData | undefined => {
    if (!pushupData) {
      return undefined;
    }

    const dateStr = formatKSTDate(date);
    return pushupData.find(data => data.date === dateStr);
  };

  const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

  const nextMonthDisabled =
    CURRENT_YEAR === selectedDate.getFullYear() &&
    CURRENT_MONTH === selectedDate.getMonth() + 1;

  const previousMonthDisabled = (() => {
    if (!user) {
      return true;
    }

    const signedUpYear = new Date(user.created_at).getFullYear();
    const signedUpMonth = new Date(user.created_at).getMonth() + 1;

    if (
      signedUpYear === selectedDate.getFullYear() &&
      signedUpMonth === selectedDate.getMonth() + 1
    ) {
      return true;
    }

    return false;
  })();

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
          disabled={previousMonthDisabled}
          onPress={handlePreviousMonth}>
          <FontAwesome5
            name="chevron-left"
            size={16}
            color={previousMonthDisabled ? colors.gray400 : colors.primary}
            iconStyle="solid"
          />
        </TouchableOpacity>

        <Text style={styles.monthYearText}>
          {calendarData.year}년 {calendarData.monthName}
        </Text>

        <TouchableOpacity
          disabled={nextMonthDisabled}
          style={styles.navButton}
          onPress={handleNextMonth}>
          <FontAwesome5
            name="chevron-right"
            size={16}
            color={nextMonthDisabled ? colors.gray400 : colors.primary}
            iconStyle="solid"
          />
        </TouchableOpacity>
      </View>

      {isExpanded && (
        <>
          <View style={styles.weekDaysContainer}>
            {weekDays.map((day, index) => (
              <Text key={index} style={styles.weekDayText}>
                {day}
              </Text>
            ))}
          </View>

          <View style={styles.calendarGrid}>
            {calendarData.days.map((day, index) => {
              return (
                <CalendarDay
                  key={index}
                  day={day}
                  pushupData={getPushupDataForDate(day.date)}
                />
              );
            })}
            <View style={styles.legend}>
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
        </>
      )}

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.footerButton}
          onPress={() => setIsExpanded(!isExpanded)}>
          <Text style={styles.footerButtonText}>
            {isExpanded ? '달력 접기' : '달력 펴기'}
          </Text>
          <FontAwesome5
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={16}
            color={colors.primary}
            iconStyle="solid"
          />
        </TouchableOpacity>
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
    height: 400,
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
  footer: {
    marginTop: 10,
  },
  footerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: colors.overlayLight,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  footerButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
});

export default Calendar;
