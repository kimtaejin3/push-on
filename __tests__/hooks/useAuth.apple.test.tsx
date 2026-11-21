import React from 'react';
import {act, create} from 'react-test-renderer';
import {useAuth} from '../../src/hooks/useAuth';
import {supabase} from '../../src/lib/supabase';
import {appleAuth} from '@invertase/react-native-apple-authentication';
import {linkAppleToken} from '../../src/remote/apple';

jest.mock('../../src/lib/supabase', () => ({
  supabase: {auth: {signInWithIdToken: jest.fn(), signOut: jest.fn()}},
}));
jest.mock('@invertase/react-native-apple-authentication', () => ({
  appleAuth: {
    performRequest: jest.fn(),
    Operation: {LOGIN: 1},
    Scope: {EMAIL: 0, FULL_NAME: 1},
    Error: {CANCELED: '1001'},
  },
}));
jest.mock('../../src/remote/apple', () => ({linkAppleToken: jest.fn()}));
jest.mock('@react-native-seoul/kakao-login', () => ({login: jest.fn(), logout: jest.fn()}));
jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: {signIn: jest.fn(), signOut: jest.fn(), hasPlayServices: jest.fn()},
  statusCodes: {},
}));

const mockPerform = appleAuth.performRequest as jest.Mock;
const mockSignInWithIdToken = supabase.auth.signInWithIdToken as jest.Mock;
const mockLink = linkAppleToken as jest.Mock;

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

describe('useAuth 애플 로그인', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    mockSignInWithIdToken.mockResolvedValue({data: {user: {id: 'u1'}}, error: null});
    (supabase.auth.signOut as jest.Mock).mockResolvedValue({error: null});
  });

  it('identityToken 과 nonce 로 Supabase 에 로그인하고 authorizationCode 를 서버에 연결한다', async () => {
    // 라이브러리는 기본값(nonceEnabled: true)으로 nonce 를 만들어 해시를 애플에 보내고,
    // 원본을 응답의 nonce 로 돌려준다. identityToken 에 nonce 클레임이 들어 있으므로
    // Supabase 에 원본 nonce 를 같이 넘기지 않으면 로그인이 거절된다.
    mockPerform.mockResolvedValue({
      identityToken: 'id-token',
      authorizationCode: 'auth-code',
      nonce: 'raw-nonce',
    });
    const result = await renderHook(() => useAuth());

    await act(async () => {
      await result.current.signInWithProvider('apple');
    });

    expect(mockSignInWithIdToken).toHaveBeenCalledWith({
      provider: 'apple',
      token: 'id-token',
      nonce: 'raw-nonce',
    });
    expect(mockLink).toHaveBeenCalledWith('auth-code');
  });

  it('identityToken 이 없으면 Supabase 로그인을 시도하지 않는다', async () => {
    mockPerform.mockResolvedValue({identityToken: null, authorizationCode: null});
    const result = await renderHook(() => useAuth());

    await act(async () => {
      await result.current.signInWithProvider('apple');
    });

    expect(mockSignInWithIdToken).not.toHaveBeenCalled();
  });

  it('Supabase 로그인이 실패하면 토큰 연결을 시도하지 않는다', async () => {
    mockPerform.mockResolvedValue({identityToken: 'id-token', authorizationCode: 'auth-code'});
    mockSignInWithIdToken.mockResolvedValue({data: null, error: {message: 'bad token'}});
    const result = await renderHook(() => useAuth());

    await act(async () => {
      await result.current.signInWithProvider('apple');
    });

    expect(mockLink).not.toHaveBeenCalled();
  });

  it('애플은 SDK 로그아웃이 없으므로 Supabase 세션만 정리한다', async () => {
    const result = await renderHook(() => useAuth());
    await act(async () => {
      await result.current.signOut('apple');
    });
    expect(supabase.auth.signOut).toHaveBeenCalledTimes(1);
  });
});
