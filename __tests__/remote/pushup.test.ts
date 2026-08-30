import {savePushupSession} from '../../src/remote/pushup';
import {supabase} from '../../src/lib/supabase';

jest.mock('../../src/lib/supabase', () => ({
  supabase: {auth: {getUser: jest.fn()}, from: jest.fn(), rpc: jest.fn()},
}));

const mockFrom = supabase.from as jest.Mock;
const mockGetUser = supabase.auth.getUser as jest.Mock;
const mockRpc = supabase.rpc as jest.Mock;

describe('savePushupSession', () => {
  let insert: jest.Mock;
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUser.mockResolvedValue({data: {user: {id: 'u1'}}});
    insert = jest.fn().mockResolvedValue({error: null});
    mockFrom.mockReturnValue({insert});
    mockRpc.mockResolvedValue({error: null});
  });

  it('모드 없이 저장하면 challenge 로 기록한다', async () => {
    await savePushupSession({reps: 12, duration_seconds: 30});
    expect(insert.mock.calls[0][0]).toMatchObject({user_id: 'u1', reps: 12, duration_seconds: 30, mode: 'challenge'});
    expect(insert.mock.calls[0][0]).not.toHaveProperty('workout_id');
  });

  it('세트 모드 필드를 그대로 넣는다', async () => {
    await savePushupSession({reps: 10, duration_seconds: 20, mode: 'sets', workout_id: 'w1', set_index: 2, target_reps: 10});
    expect(insert.mock.calls[0][0]).toMatchObject({mode: 'sets', workout_id: 'w1', set_index: 2, target_reps: 10});
    expect(mockRpc).toHaveBeenCalledWith('add_daily_pushups', {p_reps: 10});
  });
});
