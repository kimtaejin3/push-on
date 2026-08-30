import React from 'react';
import {act, create} from 'react-test-renderer';
import {useEnsureProfile} from '../../src/hooks/useEnsureProfile';
import {useSession} from '../../src/hooks/useSession';
import {findProfile, createDefaultProfile} from '../../src/remote/profile';

// 자동 목은 실제 모듈(→ supabase → url-polyfill ESM)을 로드하므로 팩토리로 대체
jest.mock('../../src/hooks/useSession', () => ({useSession: jest.fn()}));
jest.mock('../../src/remote/profile', () => ({
  findProfile: jest.fn(),
  createDefaultProfile: jest.fn(),
}));

const mockUseSession = useSession as jest.Mock;
const mockFindProfile = findProfile as jest.Mock;
const mockCreateDefaultProfile = createDefaultProfile as jest.Mock;

async function renderHook<T>(hook: () => T) {
  const result = {current: undefined as unknown as T};
  function Probe() {
    result.current = hook();
    return null;
  }
  await act(async () => {
    create(<Probe />);
  });
  return result;
}

describe('useEnsureProfile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('로그인 전이면 로딩을 끝내고 ready=false 로 둔다', async () => {
    mockUseSession.mockReturnValue({user: null});

    const result = await renderHook(() => useEnsureProfile());

    expect(result.current.loading).toBe(false);
    expect(result.current.ready).toBe(false);
    expect(mockFindProfile).not.toHaveBeenCalled();
  });

  it('프로필이 이미 있으면 만들지 않고 ready=true', async () => {
    mockUseSession.mockReturnValue({user: {id: 'u1'}});
    mockFindProfile.mockResolvedValue({id: 'u1', nickname: 'user-abc'});

    const result = await renderHook(() => useEnsureProfile());

    expect(result.current.loading).toBe(false);
    expect(result.current.ready).toBe(true);
    expect(mockCreateDefaultProfile).not.toHaveBeenCalled();
  });

  it('프로필이 없으면 기본 프로필을 만들고 ready=true', async () => {
    mockUseSession.mockReturnValue({user: {id: 'u1'}});
    mockFindProfile.mockResolvedValue(null);
    mockCreateDefaultProfile.mockResolvedValue({id: 'u1', nickname: 'user-new'});

    const result = await renderHook(() => useEnsureProfile());

    expect(mockCreateDefaultProfile).toHaveBeenCalledWith('u1');
    expect(result.current.ready).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('생성에 실패하면 error 를 노출하고 retry 로 다시 시도할 수 있다', async () => {
    mockUseSession.mockReturnValue({user: {id: 'u1'}});
    mockFindProfile.mockResolvedValue(null);
    mockCreateDefaultProfile
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce({id: 'u1', nickname: 'user-new'});

    const result = await renderHook(() => useEnsureProfile());
    expect(result.current.ready).toBe(false);
    expect(result.current.error).toBeInstanceOf(Error);

    await act(async () => {
      await result.current.retry();
    });

    expect(result.current.ready).toBe(true);
    expect(result.current.error).toBeNull();
  });
});
