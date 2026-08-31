import {CalendarDay} from '../hooks/useCalendarData';

/** 일요일 시작 기준, date 가 속한 주의 첫날 (시간은 00:00) */
export const startOfWeek = (date: Date): Date => {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  d.setDate(d.getDate() - d.getDay());
  return d;
};

export const addDays = (date: Date, days: number): Date => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

/**
 * 주 뷰용 7일. 다른 달 날짜도 흐리게 하지 않도록 isCurrentMonth 는 항상 true.
 */
export const buildWeekDays = (selectedDate: Date, today: Date = new Date()): CalendarDay[] => {
  const start = startOfWeek(selectedDate);
  const todayStr = today.toDateString();
  const selectedStr = selectedDate.toDateString();
  return Array.from({length: 7}, (_, i) => {
    const date = addDays(start, i);
    return {
      date,
      isCurrentMonth: true,
      isToday: date.toDateString() === todayStr,
      isSelected: date.toDateString() === selectedStr,
      dayOfMonth: date.getDate(),
    };
  });
};

/** "8월 23일 - 29일" / 달이 걸치면 "8월 30일 - 9월 5일" */
export const weekRangeLabel = (weekStart: Date): string => {
  const end = addDays(weekStart, 6);
  const startLabel = `${weekStart.getMonth() + 1}월 ${weekStart.getDate()}일`;
  const endLabel =
    weekStart.getMonth() === end.getMonth()
      ? `${end.getDate()}일`
      : `${end.getMonth() + 1}월 ${end.getDate()}일`;
  return `${startLabel} - ${endLabel}`;
};
