import {useState, useEffect} from 'react';
import {supabase} from '../lib/supabase';

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
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('인증 상태 변경:', event, session?.user?.email);
      setSession(session);
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

  return {
    session,
    loading,
    user: session?.user || null,
    isLoggedIn: !!session,
    signOut,
  };
};
