import React from 'react';
import {act, create} from 'react-test-renderer';
import {useAuth} from '../../src/hooks/useAuth';
import {supabase} from '../../src/lib/supabase';
import {logout as kakaoLogout} from '@react-native-seoul/kakao-login';
import {GoogleSignin} from '@react-native-google-signin/google-signin';

jest.mock('../../src/lib/supabase', () => ({
  supabase: {auth: {signOut: jest.fn()}},
}));
jest.mock('@react-native-seoul/kakao-login', () => ({
  login: jest.fn(),
  logout: jest.fn(),
}));
jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: {signOut: jest.fn(), signIn: jest.fn(), hasPlayServices: jest.fn()},
  statusCodes: {},
}));

const mockSupabaseSignOut = supabase.auth.signOut as jest.Mock;
const mockKakaoLogout = kakaoLogout as jest.Mock;
const mockGoogleSignOut = GoogleSignin.signOut as jest.Mock;

async function renderHook<T>(hook: () => T) {
  const result = {current: undefined as unknown as T};
  function Probe() {
    result.current = hook();
    return null;
  }
  await act(() => {
    create(<Probe />);
  });
  return result;
}

describe('useAuth.signOut', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabaseSignOut.mockResolvedValue({error: null});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('카카오 로그아웃이 실패해도 supabase 세션은 항상 지운다', async () => {
    mockKakaoLogout.mockRejectedValue(new Error('KakaoSDK token not found'));
    const {current} = await renderHook(() => useAuth());

    await act(async () => {
      await current.signOut('kakao');
    });

    expect(mockSupabaseSignOut).toHaveBeenCalledTimes(1);
  });

  it('구글 로그아웃이 실패해도 supabase 세션은 항상 지운다', async () => {
    mockGoogleSignOut.mockRejectedValue(new Error('not signed in'));
    const {current} = await renderHook(() => useAuth());

    await act(async () => {
      await current.signOut('google');
    });

    expect(mockSupabaseSignOut).toHaveBeenCalledTimes(1);
  });
});
