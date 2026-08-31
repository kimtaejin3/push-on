import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import FontAwesome5 from '@react-native-vector-icons/fontawesome5';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
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
import {useSession} from '../../../hooks/useSession';
import {formatKSTDate} from '../../../utils/time';
import {useQuery} from '@tanstack/react-query';
import {pushupCalendarQueryOptions} from '../../../tanstack-query';
import {addDays, buildWeekDays, startOfWeek, weekRangeLabel} from '../../../utils/calendar';

interface CalendarProps {
  selectedDate: Date;
}

type ViewMode = 'month' | 'week';

const Calendar: React.FC<CalendarProps> = ({selectedDate}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const calendarData = useCalendarData({selectedDate});
  const {user} = useSession();
  const [, updateSelectedDate] = useAtom(updateSelectedDateAtom);

  const weekStart = startOfWeek(selectedDate);
  const weekEnd = addDays(weekStart, 6);

  // 월 뷰: 선택 월. 주 뷰: 주 시작일의 월 + (달이 걸치면) 끝일의 월까지
  const primaryMonth =
    viewMode === 'month'
      ? {year: calendarData.year, month: calendarData.month + 1}
      : {year: weekStart.getFullYear(), month: weekStart.getMonth() + 1};
  const weekSpansTwoMonths =
    viewMode === 'week' && weekStart.getMonth() !== weekEnd.getMonth();

  const {data: pushupData, isLoading} = useQuery(
    pushupCalendarQueryOptions(user?.id || '', primaryMonth.year, primaryMonth.month),
  );
  const {data: nextMonthData} = useQuery({
    ...pushupCalendarQueryOptions(
      user?.id || '',
      weekEnd.getFullYear(),
      weekEnd.getMonth() + 1,
    ),
    enabled: !!user?.id && weekSpansTwoMonths,
  });

  const getPushupDataForDate = (date: Date): PushupDayData | undefined => {
    const dateStr = formatKSTDate(date);
    return (
      pushupData?.find(data => data.date === dateStr) ??
      nextMonthData?.find(data => data.date === dateStr)
    );
  };

  const handleMonthChange = (year: number, month: number) => {
    updateSelectedDate(new Date(year, month, 1));
  };

  const handlePrevious = () => {
    if (viewMode === 'week') {
      updateSelectedDate(addDays(selectedDate, -7));
      return;
    }
    const newDate = new Date(selectedDate);
    newDate.setDate(1); // 날짜를 1일로 설정하여 월 오버플로우 방지
    newDate.setMonth(newDate.getMonth() - 1);
    handleMonthChange(newDate.getFullYear(), newDate.getMonth());
  };

  const handleNext = () => {
    if (viewMode === 'week') {
      updateSelectedDate(addDays(selectedDate, 7));
      return;
    }
    const newDate = new Date(selectedDate);
    newDate.setDate(1);
    newDate.setMonth(newDate.getMonth() + 1);
    handleMonthChange(newDate.getFullYear(), newDate.getMonth());
  };

  const today = new Date();
  const nextDisabled =
    viewMode === 'week'
      ? weekEnd >= today
      : CURRENT_YEAR === selectedDate.getFullYear() &&
        CURRENT_MONTH === selectedDate.getMonth() + 1;

  const previousDisabled = (() => {
    if (!user) {
      return true;
    }
    const signedUp = new Date(user.created_at);
    const signupMonthStart = new Date(signedUp.getFullYear(), signedUp.getMonth(), 1);
    if (viewMode === 'week') {
      // 이전 주 전체가 가입 월 이전이면 이동 불가
      return addDays(weekStart, -1) < signupMonthStart;
    }
    return (
      signedUp.getFullYear() === selectedDate.getFullYear() &&
      signedUp.getMonth() === selectedDate.getMonth()
    );
  })();

  const weekDayNames = ['일', '월', '화', '수', '목', '금', '토'];
  const days = viewMode === 'month' ? calendarData.days : buildWeekDays(selectedDate);
  const title =
    viewMode === 'month'
      ? `${calendarData.year}년 ${calendarData.monthName}`
      : weekRangeLabel(weekStart);

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
      {/* 헤더: 이전/다음 + 제목 */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.navButton}
          disabled={previousDisabled}
          onPress={handlePrevious}>
          <FontAwesome5
            name="chevron-left"
            size={16}
            color={previousDisabled ? colors.gray400 : colors.primary}
            iconStyle="solid"
          />
        </TouchableOpacity>

        <Text style={styles.monthYearText}>{title}</Text>

        <TouchableOpacity
          disabled={nextDisabled}
          style={styles.navButton}
          onPress={handleNext}>
          <FontAwesome5
            name="chevron-right"
            size={16}
            color={nextDisabled ? colors.gray400 : colors.primary}
            iconStyle="solid"
          />
        </TouchableOpacity>
      </View>

      <View style={styles.weekDaysContainer}>
        {weekDayNames.map((day, index) => (
          <Text key={index} style={styles.weekDayText}>
            {day}
          </Text>
        ))}
      </View>

      <View style={styles.calendarGrid}>
        {days.map((day, index) => (
          <CalendarDay
            key={index}
            day={day}
            pushupData={getPushupDataForDate(day.date)}
          />
        ))}
      </View>

      <View style={styles.footerRow}>
        <View style={styles.legendItem}>
          <FontAwesome5
            name="check-circle"
            size={12}
            color={colors.primary}
            iconStyle="solid"
          />
          <Text style={styles.legendText}>운동 완료</Text>
        </View>
        {/* 월/주 전환: 아이콘은 전환될 뷰를 나타낸다 */}
        <TouchableOpacity
          style={styles.viewToggle}
          onPress={() => setViewMode(viewMode === 'month' ? 'week' : 'month')}>
          <FontAwesome6
            name={viewMode === 'month' ? 'calendar-week' : 'calendar-days'}
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
    marginBottom: 12,
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
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
  },
  viewToggle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.overlayMedium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});

export default Calendar;
