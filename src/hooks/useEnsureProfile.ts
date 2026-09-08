import {useState, useEffect, useCallback, useRef} from 'react';
import {useSession} from './useSession';
import {findProfile, createDefaultProfile} from '../remote/profile';

/**
 * 로그인된 유저의 프로필이 반드시 존재하도록 보장한다.
 * 없으면 랜덤 닉네임(user-xxxxxxxx)으로 자동 생성한다 — 온보딩 화면을 대체.
 *
 * 의존성은 user 객체가 아니라 user.id 다. Supabase 가 토큰을 갱신하면 같은 유저라도
 * 새 session/user 객체가 오는데, 그때마다 다시 확인하며 loading 을 켜면
 * ConditionalNavigation 이 네비게이터를 통째로 언마운트해 운동 중에도 홈으로 튕긴다.
 */
export const useEnsureProfile = () => {
  const {user} = useSession();
  const userId = user?.id ?? null;
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  // 프로필 존재를 이미 확인한 유저 id (중복 확인 방지)
  const ensuredFor = useRef<string | null>(null);

  const ensureProfile = useCallback(async () => {
    if (!userId) {
      // 로그아웃 상태: 보장할 프로필이 없으므로 로딩만 해제한다
      ensuredFor.current = null;
      setReady(false);
      setLoading(false);
      return;
    }
    if (ensuredFor.current === userId) {
      return; // 같은 유저는 다시 확인하지 않는다 (화면을 흔들지 않기 위해)
    }
    setLoading(true);
    setError(null);
    try {
      const existing = await findProfile(userId);
      if (!existing) {
        await createDefaultProfile(userId);
      }
      ensuredFor.current = userId;
      setReady(true);
    } catch (e) {
      console.error('프로필 준비 실패:', e);
      setReady(false);
      setError(e instanceof Error ? e : new Error(String(e)));
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    ensureProfile();
  }, [ensureProfile]);

  /** 실패 후 사용자가 직접 재시도할 때는 캐시를 무시하고 다시 확인한다 */
  const retry = useCallback(() => {
    ensuredFor.current = null;
    return ensureProfile();
  }, [ensureProfile]);

  return {ready, loading, error, retry};
};
