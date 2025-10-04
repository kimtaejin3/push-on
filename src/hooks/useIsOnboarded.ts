import {useState, useEffect, useCallback} from 'react';
import {supabase} from '../lib/supabase';
import {useAuth} from './useAuth';

export const useIsOnboarded = () => {
  const [isOnboarded, setIsOnboarded] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const {user} = useAuth();

  const checkOnboardingStatus = useCallback(async () => {
    if (!user) {
      setIsOnboarded(false);
      setLoading(false);
      return;
    }

    try {
      const {data, error} = await supabase
        .from('profiles')
        .select('target_reps_per_set, target_sets_per_day')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('프로필 조회 오류:', error);
        setIsOnboarded(false);
      } else if (data && data.target_reps_per_set && data.target_sets_per_day) {
        // 프로필 데이터가 있고 목표값이 설정되어 있으면 온보딩 완료
        setIsOnboarded(true);
      } else {
        // 프로필 데이터가 없거나 목표값이 설정되지 않았으면 온보딩 필요
        setIsOnboarded(false);
      }
    } catch (error) {
      console.error('온보딩 상태 확인 오류:', error);
      setIsOnboarded(false);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    checkOnboardingStatus();
  }, [user, checkOnboardingStatus]);

  return {isOnboarded, loading, refresh: checkOnboardingStatus};
};
