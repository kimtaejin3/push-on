import React from 'react';
import {act, create, ReactTestRenderer} from 'react-test-renderer';
import {useIsOnboarded} from '../../src/hooks/useIsOnboarded';
import {useSession} from '../../src/hooks/useSession';
import {supabase} from '../../src/lib/supabase';

jest.mock('../../src/lib/supabase', () => ({
  supabase: {from: jest.fn()},
}));
jest.mock('../../src/hooks/useSession');

const mockUseSession = useSession as jest.Mock;
const mockFrom = supabase.from as jest.Mock;

async function renderHook<T>(hook: () => T) {
  const result = {current: undefined as unknown as T};
  function Probe() {
    result.current = hook();
    return null;
  }
  let renderer!: ReactTestRenderer;
  await act(() => {
    renderer = create(<Probe />);
  });
  const rerender = async () => {
    await act(() => {
      renderer.update(<Probe />);
    });
  };
  return {result, rerender};
}

/** profiles 조회가 끝나지 않는 상태를 흉내낸다 */
const mockPendingProfileQuery = () => {
  mockFrom.mockReturnValue({
    select: () => ({
      eq: () => ({
        single: () => new Promise(() => {}),
      }),
    }),
  });
};

describe('useIsOnboarded', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('세션(user)이 없으면 loading 이 false 로 끝난다', async () => {
    mockUseSession.mockReturnValue({user: null});

    const {result} = await renderHook(() => useIsOnboarded());

    expect(result.current.loading).toBe(false);
  });

  it('로그아웃 상태에서 로그인되면 프로필 조회가 끝날 때까지 다시 loading 이 된다', async () => {
    mockUseSession.mockReturnValue({user: null});
    const {result, rerender} = await renderHook(() => useIsOnboarded());
    expect(result.current.loading).toBe(false);

    mockPendingProfileQuery();
    mockUseSession.mockReturnValue({user: {id: 'u1'}});
    await rerender();

    expect(result.current.loading).toBe(true);
  });
});
