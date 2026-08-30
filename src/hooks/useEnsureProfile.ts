import {useState, useEffect, useCallback} from 'react';
import {useSession} from './useSession';
import {findProfile, createDefaultProfile} from '../remote/profile';

/**
 * 로그인된 유저의 프로필이 반드시 존재하도록 보장한다.
 * 없으면 랜덤 닉네임(user-xxxxxxxx)으로 자동 생성한다 — 온보딩 화면을 대체.
 */
export const useEnsureProfile = () => {
  const {user} = useSession();
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const ensureProfile = useCallback(async () => {
    if (!user) {
      // 로그아웃 상태: 보장할 프로필이 없으므로 로딩만 해제한다
      setReady(false);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const existing = await findProfile(user.id);
      if (!existing) {
        await createDefaultProfile(user.id);
      }
      setReady(true);
    } catch (e) {
      console.error('프로필 준비 실패:', e);
      setReady(false);
      setError(e instanceof Error ? e : new Error(String(e)));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    ensureProfile();
  }, [ensureProfile]);

  return {ready, loading, error, retry: ensureProfile};
};
