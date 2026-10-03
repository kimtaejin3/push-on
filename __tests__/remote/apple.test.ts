import {linkAppleToken, revokeAppleToken} from '../../src/remote/apple';
import {supabase} from '../../src/lib/supabase';

jest.mock('../../src/lib/supabase', () => ({
  supabase: {auth: {getSession: jest.fn()}},
}));
const mockGetSession = supabase.auth.getSession as jest.Mock;

describe('remote/apple', () => {
  let fetchMock: jest.Mock;
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    mockGetSession.mockResolvedValue({data: {session: {access_token: 'jwt-1'}}});
    fetchMock = jest.fn().mockResolvedValue({ok: true, json: async () => ({success: true})});
    (global as any).fetch = fetchMock;
  });

  it('linkAppleToken 은 authorizationCode 를 apple-link 함수로 보낸다', async () => {
    await linkAppleToken('code-abc');
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain('/functions/v1/apple-link');
    expect(init.headers.Authorization).toBe('Bearer jwt-1');
    expect(JSON.parse(init.body)).toEqual({authorizationCode: 'code-abc'});
  });

  it('linkAppleToken 이 실패해도 예외를 던지지 않는다 (로그인 자체는 성공시킨다)', async () => {
    fetchMock.mockResolvedValue({ok: false, status: 500, json: async () => ({error: 'boom'})});
    await expect(linkAppleToken('code-abc')).resolves.toBeUndefined();
  });

  it('revokeAppleToken 은 apple-revoke 함수를 호출한다', async () => {
    await revokeAppleToken();
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain('/functions/v1/apple-revoke');
    expect(init.headers.Authorization).toBe('Bearer jwt-1');
  });

  it('세션이 없으면 아무 요청도 보내지 않는다', async () => {
    mockGetSession.mockResolvedValue({data: {session: null}});
    await linkAppleToken('code-abc');
    await revokeAppleToken();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
