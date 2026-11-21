import {useEffect, useRef} from 'react';
import {AppState} from 'react-native';
import {useQuery, useQueryClient} from '@tanstack/react-query';
import {planStreakNotifications} from '../../../domain/streakNotifications';
import {useNow} from '../../../hooks/useNow';
import {useWorkoutDates} from '../../../hooks/useStreak';
import {flushPendingSaves, onPendingFlushed} from '../../../remote/pushup';
import {
  cancelStreakNotifications,
  syncStreakNotifications,
} from '../../../services/streakNotifications';
import {queryKeys} from '../../../tanstack-query/queryKeys';
import {loadStreakReminder} from '../../../utils/streakStorage';
import {formatKSTDate} from '../../../utils/time';

/**
 * 화면 없는 컴포넌트. 로그인된 상태에서만 렌더링되며,
 * 앱 시작·포그라운드 복귀 때 저장에 실패해 보관 중인 운동을 다시 보낸다.
 * 하나라도 보냈으면(여기서 시작했든 저장 성공 뒤 뒤에서 돌았든) 운동 기록 캐시를 무효화해
 * 스트릭·기록 화면을 새로 그린다.
 *
 * 스트릭 알림도 여기서 걸어 둔다. 날짜 목록·알림 설정이 바뀌거나 앱이 포그라운드로 돌아올 때
 * 앞으로 3일 치를 다시 계획한다. 알림을 끄거나 로그아웃하면(이 컴포넌트가 사라지므로) 모두 취소한다.
 */
function StreakRuntime(): null {
  const queryClient = useQueryClient();
  const dates = useWorkoutDates();
  const {now} = useNow();
  const {data: settings} = useQuery({
    queryKey: queryKeys.streak.reminder,
    queryFn: loadStreakReminder,
    // 폰에만 저장되는 값이라 설정 화면이 저장 뒤 무효화할 때만 다시 읽는다
    staleTime: Infinity,
  });

  // 알림 예약은 비동기라 순서대로 돌려야 한다.
  // 겹치면 이전 계획의 알림이 새 계획의 취소 뒤에 걸려 남을 수 있다.
  const notificationQueue = useRef<Promise<void>>(Promise.resolve());
  const enqueue = useRef((task: () => Promise<void>) => {
    notificationQueue.current = notificationQueue.current
      .then(task)
      // 권한이 없거나 예약에 실패해도 화면으로 던지지 않는다
      .catch(error => console.warn('스트릭 알림 예약 실패:', error));
  }).current;

  useEffect(
    () =>
      onPendingFlushed(() => {
        queryClient.invalidateQueries({queryKey: queryKeys.pushup.all});
      }),
    [queryClient],
  );

  useEffect(() => {
    const flush = () => {
      flushPendingSaves().catch(error => console.warn('보관 중인 운동 재전송 실패:', error));
    };

    flush();
    const subscription = AppState.addEventListener('change', nextState => {
      if (nextState === 'active') {
        flush();
      }
    });
    return () => subscription.remove();
  }, [queryClient]);

  // now 는 포그라운드 복귀 때 갱신된다 → 그때마다 그 시점 기준으로 다시 건다
  useEffect(() => {
    if (!settings) {
      return; // 설정을 아직 읽는 중
    }
    if (!settings.enabled) {
      enqueue(cancelStreakNotifications);
      return;
    }
    if (dates === null) {
      // 날짜를 못 받았다(조회 중·일시적 실패) — 걸어 둔 알림은 그대로 두고 다시 계획만 미룬다.
      // 여기서 취소하면 약한 네트워크 한 번에 그날 저녁 "곧 끊겨요" 알림까지 사라진다
      return;
    }
    enqueue(() => {
      const at = new Date();
      return syncStreakNotifications(planStreakNotifications(dates, formatKSTDate(at), at, settings));
    });
  }, [dates, settings, now, enqueue]);

  // 로그아웃(언마운트)하면 남의 계정 스트릭으로 알림이 가지 않게 모두 취소한다
  useEffect(() => () => enqueue(cancelStreakNotifications), [enqueue]);

  return null;
}

export default StreakRuntime;
