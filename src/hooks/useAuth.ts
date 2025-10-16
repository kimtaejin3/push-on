import {useState, useEffect} from 'react';
import {supabase} from '../lib/supabase';
import {AppState} from 'react-native';

export const useAuth = () => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 초기 세션 확인
    const getInitialSession = async () => {
      try {
        const {
          data: {session: sessionData},
          error,
        } = await supabase.auth.getSession();
        if (error) {
          console.error('세션 가져오기 오류:', error);
        } else {
          setSession(sessionData);
        }
      } catch (error) {
        console.error('세션 확인 중 오류:', error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // 세션 변경 감지
    const {
      data: {subscription},
    } = supabase.auth.onAuthStateChange((event, newSession) => {
      console.log('인증 상태 변경:', event, newSession?.user?.email);
      setSession(newSession);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // 로그아웃 함수
  const signOut = async () => {
    const {error} = await supabase.auth.signOut();
    return {error};
  };

  // 세션 확인 및 갱신 로직
  const checkAndRefreshSession = async () => {
    try {
      const {
        data: {session: sessionData},
        error,
      } = await supabase.auth.getSession();

      if (error) {
        console.error('세션 확인 오류:', error);
        return;
      }

      if (sessionData) {
        // 세션이 만료되기 전에 미리 갱신
        const expiresAt = new Date(sessionData.expires_at! * 1000);
        const now = new Date();
        const timeUntilExpiry = expiresAt.getTime() - now.getTime();

        // 5분 전에 갱신
        if (timeUntilExpiry < 5 * 60 * 1000) {
          console.log('세션 갱신 시도...');
          const {error: refreshError} = await supabase.auth.refreshSession();
          if (refreshError) {
            console.error('세션 갱신 실패:', refreshError);
          } else {
            console.log('세션 갱신 성공');
          }
        }
      } else {
        console.log('저장된 세션이 없음');
      }
    } catch (error) {
      console.error('세션 확인 중 오류:', error);
    }
  };

  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'active') {
        checkAndRefreshSession();
      }
    };

    const subscription = AppState.addEventListener(
      'change',
      handleAppStateChange,
    );

    return () => {
      subscription?.remove();
    };
  }, []);

  return {
    session,
    loading,
    user: session?.user || null,
    isLoggedIn: !!session,
    signOut,
    checkAndRefreshSession,
  };
};
