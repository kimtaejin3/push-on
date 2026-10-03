import {deleteUserAccount} from '../../src/remote/auth';
import {supabase} from '../../src/lib/supabase';
import {revokeAppleToken} from '../../src/remote/apple';

jest.mock('../../src/lib/supabase', () => ({
  supabase: {auth: {getUser: jest.fn(), getSession: jest.fn()}},
}));
jest.mock('../../src/remote/apple', () => ({revokeAppleToken: jest.fn()}));

const mockGetUser = supabase.auth.getUser as jest.Mock;
const mockGetSession = supabase.auth.getSession as jest.Mock;
const mockRevoke = revokeAppleToken as jest.Mock;

describe('deleteUserAccount', () => {
  let calls: string[];
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    calls = [];
    mockGetUser.mockResolvedValue({data: {user: {id: 'u1'}}, error: null});
    mockGetSession.mockResolvedValue({data: {session: {access_token: 'jwt-1'}}});
    mockRevoke.mockImplementation(async () => {
      calls.push('revoke');
    });
    (global as any).fetch = jest.fn(async () => {
      calls.push('delete');
      return {ok: true, json: async () => ({success: true})};
    });
  });

  it('계정 삭제 전에 애플 토큰을 먼저 revoke 한다', async () => {
    await deleteUserAccount();
    expect(calls).toEqual(['revoke', 'delete']);
  });

  it('revoke 가 실패해도 계정 삭제는 진행한다', async () => {
    mockRevoke.mockRejectedValue(new Error('apple down'));
    await expect(deleteUserAccount()).resolves.toBeUndefined();
    expect(calls).toEqual(['delete']);
  });
});
