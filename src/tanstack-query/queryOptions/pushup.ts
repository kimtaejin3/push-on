import {
  getTodayPushupSets,
  getWeeklyPushupStats,
  getMonthlyPushupStats,
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
  weeklyPushupStatsQueryOptions,
  monthlyPushupStatsQueryOptions,
};
