import {useMemo} from 'react';

export interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  dayOfMonth: number;
}

export interface CalendarData {
  year: number;
  month: number;
  days: CalendarDay[];
  monthName: string;
}

interface UseCalendarDataProps {
  selectedDate: Date;
  currentDate?: Date;
}

export const useCalendarData = ({
  selectedDate,
  currentDate = new Date(),
}: UseCalendarDataProps): CalendarData => {
  return useMemo(() => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();

    // 월 이름 배열
    const monthNames = [
      '1월',
      '2월',
      '3월',
      '4월',
      '5월',
      '6월',
      '7월',
      '8월',
      '9월',
      '10월',
      '11월',
      '12월',
    ];

    // 해당 월의 첫 번째 날과 마지막 날
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    // 달력에 표시할 첫 번째 날 (이전 달의 일부 포함)
    const firstDayOfCalendar = new Date(firstDayOfMonth);
    firstDayOfCalendar.setDate(
      firstDayOfCalendar.getDate() - firstDayOfMonth.getDay(),
    );

    // 달력에 표시할 마지막 날 (다음 달의 일부 포함)
    const lastDayOfCalendar = new Date(lastDayOfMonth);
    lastDayOfCalendar.setDate(
      lastDayOfCalendar.getDate() + (6 - lastDayOfMonth.getDay()),
    );

    const days: CalendarDay[] = [];
    const currentDateStr = currentDate.toDateString();
    const selectedDateStr = selectedDate.toDateString();

    // 달력의 모든 날짜 생성
    const startDate = new Date(firstDayOfCalendar);
    const endDate = new Date(lastDayOfCalendar);

    while (startDate <= endDate) {
      // 현재 날짜의 정보를 먼저 저장
      const currentDate = new Date(startDate);
      const dayOfMonth = currentDate.getDate();
      const isCurrentMonth = currentDate.getMonth() === month;
      const isToday = currentDate.toDateString() === currentDateStr;
      const isSelected = currentDate.toDateString() === selectedDateStr;

      days.push({
        date: currentDate,
        isCurrentMonth,
        isToday,
        isSelected,
        dayOfMonth,
      });

      // 다음 날로 이동
      startDate.setDate(startDate.getDate() + 1);
    }

    console.log(
      'days',
      days.map(day => {
        return {
          ...day,
          date: `${day.date.getFullYear()}-${String(
            day.date.getMonth() + 1,
          ).padStart(2, '0')}-${String(day.date.getDate()).padStart(2, '0')}`,
        };
      }),
    );

    return {
      year,
      month,
      days,
      monthName: monthNames[month],
    };
  }, [selectedDate, currentDate]);
};
