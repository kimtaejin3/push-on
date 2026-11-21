import {useMemo} from 'react';
import {useQuery} from '@tanstack/react-query';
import {computeStreak, StreakState} from '../domain/streak';
import {getWorkoutDates} from '../remote/streak';
import {queryKeys} from '../tanstack-query/queryKeys';
import {loadPendingSaves} from '../utils/pendingSaves';
import {formatKSTDate} from '../utils/time';
import {useNow} from './useNow';
import {useSession} from './useSession';

/**
 * 운동한 날짜 목록 = 서버 날짜 ∪ 폰에 보관 중인(아직 못 보낸) 내 운동의 날짜.
 * 보관 중인 운동도 한 것으로 쳐야 네트워크가 끊긴 날 스트릭이 끊기지 않는다.
 * 서버 날짜를 못 받았으면(함수가 아직 없거나 오류) null — 스트릭 화면·알림을 숨긴다.
 */
export const useWorkoutDates = (): string[] | null => {
  const {user} = useSession();
  const userId = user?.id;

  const serverQuery = useQuery({
    queryKey: queryKeys.pushup.workoutDates,
    queryFn: getWorkoutDates,
    enabled: !!userId,
    // 함수가 서버에 없을 때 실패를 반복 호출하지 않도록 재시도하지 않는다
    retry: false,
  });

  const pendingQuery = useQuery({
    queryKey: queryKeys.pushup.pendingDates,
    queryFn: async () =>
      (await loadPendingSaves())
        .filter(item => item.userId === userId)
        .map(item => item.workout_date),
    enabled: !!userId,
  });

  const serverDates = serverQuery.data;
  const pendingDates = pendingQuery.data;
  return useMemo(() => {
    if (!serverDates) {
      return null;
    }
    return [...new Set([...serverDates, ...(pendingDates ?? [])])].sort();
  }, [serverDates, pendingDates]);
};

/** 오늘 기준 스트릭. 앱이 포그라운드로 돌아오면 그날 날짜로 다시 계산한다. 날짜 목록이 없으면 null. */
export const useStreak = (): StreakState | null => {
  const dates = useWorkoutDates();
  const {now} = useNow();
  const today = formatKSTDate(now);
  return useMemo(() => (dates ? computeStreak(dates, today) : null), [dates, today]);
};
