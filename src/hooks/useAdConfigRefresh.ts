import {useEffect} from 'react';
import {AppState} from 'react-native';
import {useQueryClient} from '@tanstack/react-query';
import {queryKeys} from '../tanstack-query/queryKeys';

// 앱이 켜져 있는 동안 서버 광고 설정을 다시 읽는 주기
const AD_CONFIG_REFRESH_INTERVAL_MS = 5 * 60 * 1000;

/**
 * 서버에서 광고를 끄면 오래 켜 둔 앱에도 바로 반영되도록 광고 설정을 다시 읽는다.
 * - 앱이 포그라운드로 돌아올 때 즉시
 * - 포그라운드에 있는 동안 5분마다 (백그라운드에서는 읽지 않는다)
 * 앱 전체에서 한 번만 쓴다 (AdsBootstrap).
 */
export function useAdConfigRefresh() {
  const queryClient = useQueryClient();

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined;

    const refresh = () => {
      // 구독 중인 광고 설정 쿼리는 무효화와 함께 바로 다시 조회된다
      queryClient.invalidateQueries({queryKey: queryKeys.appConfig.ads});
    };
    const startTimer = () => {
      clearInterval(timer);
      timer = setInterval(refresh, AD_CONFIG_REFRESH_INTERVAL_MS);
    };
    const stopTimer = () => {
      clearInterval(timer);
      timer = undefined;
    };

    if (AppState.currentState === 'active') {
      startTimer();
    }

    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') {
        refresh();
        startTimer();
      } else {
        stopTimer();
      }
    });

    return () => {
      subscription.remove();
      stopTimer();
    };
  }, [queryClient]);
}
