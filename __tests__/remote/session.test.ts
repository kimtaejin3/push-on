import {AuthApiError} from '@supabase/supabase-js';
import {signOutIfUserDeleted} from '../../src/remote/session';
import {supabase} from '../../src/lib/supabase';

jest.mock('../../src/lib/supabase', () => ({
  supabase: {auth: {getUser: jest.fn(), signOut: jest.fn()}},
}));

const mockGetUser = supabase.auth.getUser as jest.Mock;
const mockSignOut = supabase.auth.signOut as jest.Mock;

describe('signOutIfUserDeleted', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSignOut.mockResolvedValue({error: null});
  });

  it('서버에 유저가 없으면(403 user_not_found) 로컬 세션을 지우고 true 를 돌려준다', async () => {
    mockGetUser.mockResolvedValue({
      data: {user: null},
      error: new AuthApiError('User from sub claim in JWT does not exist', 403, 'user_not_found'),
    });

    await expect(signOutIfUserDeleted()).resolves.toBe(true);
    expect(mockSignOut).toHaveBeenCalledWith({scope: 'local'});
  });

  it('유저가 정상이면 세션을 건드리지 않고 false 를 돌려준다', async () => {
    mockGetUser.mockResolvedValue({data: {user: {id: 'u1'}}, error: null});

    await expect(signOutIfUserDeleted()).resolves.toBe(false);
    expect(mockSignOut).not.toHaveBeenCalled();
  });

  it('네트워크 오류(AuthApiError 아님)면 세션을 지우지 않는다', async () => {
    mockGetUser.mockResolvedValue({data: {user: null}, error: new Error('Network request failed')});

    await expect(signOutIfUserDeleted()).resolves.toBe(false);
    expect(mockSignOut).not.toHaveBeenCalled();
  });
});
