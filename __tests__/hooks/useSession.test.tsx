import React from 'react';
import type {act as actType, create as createType} from 'react-test-renderer';
import {AuthApiError} from '@supabase/supabase-js';

jest.mock('../../src/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      getUser: jest.fn(),
      signOut: jest.fn(),
      onAuthStateChange: jest.fn(() => ({
        data: {subscription: {unsubscribe: jest.fn()}},
      })),
    },
  },
}));

const storedSession = {
  access_token: 'stale-jwt',
  refresh_token: 'r',
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  user: {id: 'deleted-user'},
};

const userNotFound = new AuthApiError(
  'User from sub claim in JWT does not exist',
  403,
  'user_not_found',
);

/**
 * useSession 은 모듈 스코프 상태를 가질 수 있으므로 테스트마다 모듈을 새로 로드한다.
 * (jest.mock 은 resetModules 이후에도 유지되지만 factory 가 다시 실행되어
 *  jest.fn 인스턴스가 새로 만들어지므로 supabase 도 같이 다시 require 한다)
 */
function loadFresh() {
  jest.resetModules();
  // 훅과 렌더러가 같은 react 인스턴스를 쓰도록 둘 다 새 모듈 레지스트리에서 가져온다
  const {act, create} = require('react-test-renderer') as {
    act: typeof actType;
    create: typeof createType;
  };
  const {useSession} = require('../../src/hooks/useSession') as typeof import('../../src/hooks/useSession');
  const {supabase} = require('../../src/lib/supabase') as typeof import('../../src/lib/supabase');
  const mockGetSession = supabase.auth.getSession as jest.Mock;
  const mockGetUser = supabase.auth.getUser as jest.Mock;
  const mockSignOut = supabase.auth.signOut as jest.Mock;

  async function renderHooks<T>(hook: () => T, instances = 1) {
  const results: {current: T}[] = Array.from({length: instances}, () => ({
    current: undefined as unknown as T,
  }));
  function Probe({index}: {index: number}) {
    results[index].current = hook();
    return null;
  }
  await act(async () => {
    create(
      <>
        {results.map((_, i) => (
          <Probe key={i} index={i} />
        ))}
      </>,
    );
  });
    // getInitialSession 의 스플래시 최소 표시 딜레이(500ms)를 넘긴다
    await act(async () => {
      await jest.advanceTimersByTimeAsync(600);
    });
    return results;
  }

  return {useSession, mockGetSession, mockGetUser, mockSignOut, renderHooks};
}

describe('useSession 초기 세션 검증', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });
  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('저장된 세션의 유저가 서버에서 삭제됐으면 로그아웃 상태로 시작한다', async () => {
    const {useSession, mockGetSession, mockGetUser, mockSignOut, renderHooks} = loadFresh();
    mockGetSession.mockResolvedValue({data: {session: storedSession}, error: null});
    mockGetUser.mockResolvedValue({data: {user: null}, error: userNotFound});
    mockSignOut.mockResolvedValue({error: null});

    const [result] = await renderHooks(() => useSession());

    expect(result.current.loading).toBe(false);
    expect(result.current.session).toBeNull();
    expect(result.current.isLoggedIn).toBe(false);
  });

  it('유저가 정상이면 저장된 세션으로 시작한다', async () => {
    const {useSession, mockGetSession, mockGetUser, mockSignOut, renderHooks} = loadFresh();
    mockGetSession.mockResolvedValue({data: {session: storedSession}, error: null});
    mockGetUser.mockResolvedValue({data: {user: storedSession.user}, error: null});

    const [result] = await renderHooks(() => useSession());

    expect(result.current.loading).toBe(false);
    expect(result.current.session).toEqual(storedSession);
    expect(mockSignOut).not.toHaveBeenCalled();
  });

  it('여러 컴포넌트가 동시에 useSession 을 써도 서버 검증과 로그아웃은 한 번만 한다', async () => {
    const {useSession, mockGetSession, mockGetUser, mockSignOut, renderHooks} = loadFresh();
    mockGetSession.mockResolvedValue({data: {session: storedSession}, error: null});
    mockGetUser.mockResolvedValue({data: {user: null}, error: userNotFound});
    mockSignOut.mockResolvedValue({error: null});

    const results = await renderHooks(() => useSession(), 3);

    expect(mockGetUser).toHaveBeenCalledTimes(1);
    expect(mockSignOut).toHaveBeenCalledTimes(1);
    results.forEach(r => expect(r.current.session).toBeNull());
  });
});
