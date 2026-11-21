import {useCallback, useEffect, useState} from 'react';
import {AppState} from 'react-native';

/**
 * 지금 시각. 앱이 포그라운드로 돌아올 때 갱신되고, refresh() 로 직접 갱신할 수 있다.
 *
 * 렌더링 중에 new Date() 를 부르면 화면이 다시 그려지기 전까지 그 시각에 머문다.
 * 앱을 켜 둔 채 날짜가 바뀌면 "오늘" 판단이 어제에 고정되므로,
 * 돌아올 때마다 시각을 다시 읽어 화면을 새로 그리게 한다.
 */
export const useNow = () => {
  const [now, setNow] = useState(() => new Date());
  const refresh = useCallback(() => setNow(new Date()), []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextState => {
      if (nextState === 'active') {
        refresh();
      }
    });
    return () => subscription.remove();
  }, [refresh]);

  return {now, refresh};
};
