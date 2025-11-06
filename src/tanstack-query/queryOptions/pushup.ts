import {
  getTodayPushupSets,
  getWeeklyPushupStats,
  getMonthlyPushupStats,
  getPushupCalendarData,
  getPushupStats,
  processWeeklyStats,
  processMonthlyStats,
} from '../../remote/pushup';
import {queryKeys} from '../queryKeys';

const pushUpSetsByDateQueryOptions = (
  year: number,
  month: number,
  day: number,
) => {
  return {
    queryKey: queryKeys.pushup.sets(year, month, day),
    queryFn: () => getTodayPushupSets({year, month, day}),
  };
};

const pushupCalendarQueryOptions = (
  userId: string,
  year: number,
  month: number,
) => {
  return {
    queryKey: queryKeys.pushup.calendar(year, month),
    queryFn: () => getPushupCalendarData(userId, year, month),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5분
  };
};

/**
 * 통합 푸쉬업 통계 데이터 query option (최적화)
 * 30일 데이터를 한 번만 가져와서 클라이언트에서 가공
 */
const pushupStatsQueryOptions = (days: number = 30) => {
  return {
    queryKey: queryKeys.pushup.stats.raw(days),
    queryFn: () => getPushupStats(days),
    staleTime: 5 * 60 * 1000, // 5분
  };
};

const weeklyPushupStatsQueryOptions = () => {
  return {
    queryKey: queryKeys.pushup.stats.weekly,
    queryFn: getWeeklyPushupStats,
    staleTime: 5 * 60 * 1000, // 5분
  };
};

const monthlyPushupStatsQueryOptions = () => {
  return {
    queryKey: queryKeys.pushup.stats.monthly,
    queryFn: getMonthlyPushupStats,
    staleTime: 5 * 60 * 1000,
  };
};

export {
  pushUpSetsByDateQueryOptions,
  pushupCalendarQueryOptions,
  pushupStatsQueryOptions,
  weeklyPushupStatsQueryOptions,
  monthlyPushupStatsQueryOptions,
  // 클라이언트 사이드 가공 함수들도 export
  processWeeklyStats,
  processMonthlyStats,
};
