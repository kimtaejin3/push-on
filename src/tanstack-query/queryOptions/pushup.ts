import {
  getTodayPushupSets,
  getWeeklyPushupStats,
  getMonthlyPushupStats,
  getPushupCalendarData,
  getPushupStats,
  processWeeklyStats,
  processMonthlyStats,
  getDailyLeaderboard,
  getMonthlyLeaderboard,
  getYearlyLeaderboard,
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

/**
 * 일일 리더보드 query option
 * @param date YYYY-MM-DD 형식의 날짜
 */
const dailyLeaderboardQueryOptions = (date: string) => {
  return {
    queryKey: queryKeys.pushup.leaderboard.daily(date),
    queryFn: () => getDailyLeaderboard(date),
    staleTime: 2 * 60 * 1000, // 2분 (리더보드는 자주 업데이트될 수 있음)
  };
};

/**
 * 월간 리더보드 query option
 * @param year 연도 (예: 2025)
 * @param month 월 (1-12)
 */
const monthlyLeaderboardQueryOptions = (year: number, month: number) => {
  return {
    queryKey: queryKeys.pushup.leaderboard.monthly(year, month),
    queryFn: () => getMonthlyLeaderboard(year, month),
    staleTime: 5 * 60 * 1000, // 5분
  };
};

/**
 * 연간 리더보드 query option
 * @param year 연도 (예: 2025)
 */
const yearlyLeaderboardQueryOptions = (year: number) => {
  return {
    queryKey: queryKeys.pushup.leaderboard.yearly(year),
    queryFn: () => getYearlyLeaderboard(year),
    staleTime: 10 * 60 * 1000, // 10분 (연간 데이터는 자주 변하지 않음)
  };
};

export {
  pushUpSetsByDateQueryOptions,
  pushupCalendarQueryOptions,
  pushupStatsQueryOptions,
  weeklyPushupStatsQueryOptions,
  monthlyPushupStatsQueryOptions,
  dailyLeaderboardQueryOptions,
  monthlyLeaderboardQueryOptions,
  yearlyLeaderboardQueryOptions,
  // 클라이언트 사이드 가공 함수들도 export
  processWeeklyStats,
  processMonthlyStats,
};
