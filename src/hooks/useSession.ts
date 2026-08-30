import {useState, useEffect} from 'react';
import {supabase} from '../lib/supabase';
import {AppState} from 'react-native';
import {Session} from '@supabase/supabase-js';
import {signOutIfUserDeleted} from '../remote/session';

/**
 * 저장된 세션의 서버 검증은 프로세스당 한 번이면 충분하다.
 * useSession 은 여러 컴포넌트가 각자 호출하므로, 인스턴스마다 /user 를 부르고
 * 죽은 세션이면 signOut 을 여러 번 보내는 일이 없도록 in-flight promise 를 공유한다.
 */
let storedSessionValidation: Promise<boolean> | null = null;
const validateStoredSessionOnce = () => {
  if (!storedSessionValidation) {
    storedSessionValidation = signOutIfUserDeleted();
  }
  return storedSessionValidation;
};

//TODO: user가 null일 경우의 처리는 여기서 해주기
export const useSession = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getInitialSession = async () => {
      try {
        setLoading(true);
        const {
          data: {session: sessionData},
          error,
        } = await supabase.auth.getSession();
        if (error) {
          console.error('세션 가져오기 오류:', error);
        } else if (sessionData && (await validateStoredSessionOnce())) {
          // 회원 탈퇴 등으로 서버에서 사라진 유저의 세션이 기기에 남아 있던 경우
          setSession(null);
        } else {
          setSession(sessionData);
        }
        // 스플래시 화면을 최소 1초간 표시
        await new Promise(resolve => setTimeout(resolve, 500));
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
      setSession(newSession);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

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
          const {error: refreshError} = await supabase.auth.refreshSession();
          if (refreshError) {
            console.error('세션 갱신 실패:', refreshError);
          }
        }
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
    user: session?.user ?? null,
    isLoggedIn: !!session,
    loading,
    checkAndRefreshSession,
  };
};
