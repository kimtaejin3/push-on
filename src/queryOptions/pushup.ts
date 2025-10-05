import {getTodayPushupSets} from '../remote/pushup';

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

export {pushUpSetsByDateQueryOptions};
