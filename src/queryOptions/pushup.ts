import {queryClient} from '../../App';
import {
  getTodayPushupSets,
  getWeeklyPushupStats,
  getMonthlyPushupStats,
  savePushupSession,
} from '../remote/pushup';

const pushUpSetsByDateQueryOptions = (
  year: number,
  month: number,
  day: number,
) => {
  return {
    queryKey: ['pushup', 'sets', year, month, day],
    queryFn: () => getTodayPushupSets({year, month, day}),
  };
};

const weeklyPushupStatsQueryOptions = () => {
  return {
    queryKey: ['pushup', 'stats', 'weekly'],
    queryFn: getWeeklyPushupStats,
    staleTime: 5 * 60 * 1000, // 5분
  };
};

const monthlyPushupStatsQueryOptions = () => {
  return {
    queryKey: ['pushup', 'stats', 'monthly'],
    queryFn: getMonthlyPushupStats,
    staleTime: 5 * 60 * 1000,
  };
};

const savePushupSessionMutationOptions = () => {
  return {
    mutationFn: savePushupSession,
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['pushup']});
    },
  };
};

export {
  pushUpSetsByDateQueryOptions,
  weeklyPushupStatsQueryOptions,
  monthlyPushupStatsQueryOptions,
  savePushupSessionMutationOptions,
};
