import {useEffect} from 'react';
import {AppState} from 'react-native';
import {useQueryClient} from '@tanstack/react-query';
import {flushPendingSaves} from '../../../remote/pushup';
import {queryKeys} from '../../../tanstack-query/queryKeys';

/**
 * 화면 없는 컴포넌트. 로그인된 상태에서만 렌더링되며,
 * 앱 시작·포그라운드 복귀 때 저장에 실패해 보관 중인 운동을 다시 보낸다.
 * 하나라도 보냈으면 운동 기록 캐시를 무효화해 스트릭·기록 화면을 새로 그린다.
 */
function StreakRuntime(): null {
  const queryClient = useQueryClient();

  useEffect(() => {
    const flush = () => {
      flushPendingSaves()
        .then(count => {
          if (count > 0) {
            queryClient.invalidateQueries({queryKey: queryKeys.pushup.all});
          }
        })
        .catch(error => console.warn('보관 중인 운동 재전송 실패:', error));
    };

    flush();
    const subscription = AppState.addEventListener('change', nextState => {
      if (nextState === 'active') {
        flush();
      }
    });
    return () => subscription.remove();
  }, [queryClient]);

  return null;
}

export default StreakRuntime;
