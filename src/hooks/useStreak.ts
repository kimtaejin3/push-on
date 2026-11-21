import {useMemo} from 'react';
import {useQuery} from '@tanstack/react-query';
import {computeStreak, StreakState} from '../domain/streak';
import {getWorkoutDates, retryWorkoutDates} from '../remote/streak';
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
    queryKey: queryKeys.pushup.workoutDates(userId ?? ''),
    queryFn: getWorkoutDates,
    enabled: !!userId,
    // 함수가 서버에 없으면 반복 호출하지 않고, 그 밖의 오류는 몇 번 다시 시도한다
    retry: retryWorkoutDates,
  });

  const pendingQuery = useQuery({
    queryKey: queryKeys.pushup.pendingDates(userId ?? ''),
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

/**
 * 오늘 기준 스트릭. 날짜 목록이 없으면 null.
 * now 를 넘기면 그 시각의 날짜를 오늘로 본다 — 화면이 쓰는 시계와 같은 것을 넘겨야
 * 배너와 스트릭이 서로 다른 날을 보지 않는다. 안 넘기면 포그라운드 복귀 때 갱신되는 자체 시계를 쓴다.
 */
export const useStreak = (now?: Date): StreakState | null => {
  const dates = useWorkoutDates();
  const {now: ownNow} = useNow();
  const today = formatKSTDate(now ?? ownNow);
  return useMemo(() => (dates ? computeStreak(dates, today) : null), [dates, today]);
};
