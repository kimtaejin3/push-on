import {useState, useEffect, useCallback} from 'react';
import {supabase} from '../lib/supabase';
import {useSession} from './useSession';

export const useIsOnboarded = () => {
  const [isOnboarded, setIsOnboarded] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const {user} = useSession();

  const checkOnboardingStatus = useCallback(async () => {
    if (!user) {
      // 로그아웃 상태: 조회할 프로필이 없으므로 로딩만 해제한다
      setLoading(false);
      return;
    }
    // 로그아웃 → 로그인 전환 시 이전 결과로 화면이 잠깐 잘못 뜨지 않도록 다시 로딩 상태로 돌린다
    setLoading(true);
    try {
      const {data, error} = await supabase
        .from('profiles')
        .select('target_reps_per_set')
        .eq('id', user?.id)
        .single();

      if (error) {
        console.error('프로필 조회 오류:', error);
        setIsOnboarded(false);
      } else if (data && data.target_reps_per_set) {
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
  }, [checkOnboardingStatus]);

  return {isOnboarded, loading, refresh: checkOnboardingStatus};
};
