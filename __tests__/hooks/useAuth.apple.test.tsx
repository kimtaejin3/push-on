import React from 'react';
import {act, create} from 'react-test-renderer';
import {useAuth} from '../../src/hooks/useAuth';
import {supabase} from '../../src/lib/supabase';
import {appleAuth} from '@invertase/react-native-apple-authentication';
import {linkAppleToken} from '../../src/remote/apple';

jest.mock('../../src/lib/supabase', () => ({
  supabase: {
    auth: {signInWithIdToken: jest.fn(), signOut: jest.fn(), getSession: jest.fn()},
  },
}));
const mockLinkGuest = jest.fn();
jest.mock('../../src/remote/guest', () => ({
  isGuestUser: (user?: {is_anonymous?: boolean}) => user?.is_anonymous === true,
  linkIdTokenToGuest: (...args: unknown[]) => mockLinkGuest(...args),
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
    (supabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: {session: {user: {id: 'u1', is_anonymous: false}}},
    });
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

  it('게스트면 새로 로그인하지 않고 지금 계정에 애플을 연결한다', async () => {
    (supabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: {session: {user: {id: 'guest', is_anonymous: true}}},
    });
    mockLinkGuest.mockResolvedValue({status: 'linked'});
    mockPerform.mockResolvedValue({identityToken: 'id-token', authorizationCode: 'auth-code', nonce: 'n'});
    const result = await renderHook(() => useAuth());

    let outcome;
    await act(async () => {
      outcome = await result.current.signInWithProvider('apple');
    });

    expect(outcome).toEqual({status: 'success'});
    expect(mockLinkGuest).toHaveBeenCalledWith({provider: 'apple', token: 'id-token', nonce: 'n'});
    expect(mockSignInWithIdToken).not.toHaveBeenCalled();
    expect(mockLink).toHaveBeenCalledWith('auth-code');
  });

  it('게스트가 연결하려는 애플 계정이 이미 있으면 확인 뒤 그 계정으로 로그인한다', async () => {
    (supabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: {session: {user: {id: 'guest', is_anonymous: true}}},
    });
    mockLinkGuest.mockResolvedValue({status: 'exists'});
    mockPerform.mockResolvedValue({identityToken: 'id-token', authorizationCode: 'auth-code', nonce: 'n'});
    const result = await renderHook(() => useAuth());

    let outcome: {status: string; continueSignIn?: () => Promise<void>} = {status: ''};
    await act(async () => {
      outcome = (await result.current.signInWithProvider('apple')) as typeof outcome;
    });
    expect(outcome.status).toBe('exists');
    expect(mockSignInWithIdToken).not.toHaveBeenCalled();

    await act(async () => {
      await outcome.continueSignIn?.();
    });
    expect(mockSignInWithIdToken).toHaveBeenCalledWith({provider: 'apple', token: 'id-token', nonce: 'n'});
    expect(mockLink).toHaveBeenCalledWith('auth-code');
  });
});
