import {getWorkoutDates} from '../../src/remote/streak';
import {supabase} from '../../src/lib/supabase';

jest.mock('../../src/lib/supabase', () => ({
  supabase: {rpc: jest.fn()},
}));

const mockRpc = supabase.rpc as jest.Mock;

describe('getWorkoutDates', () => {
  beforeEach(() => jest.clearAllMocks());

  it('get_my_workout_dates 결과 배열을 그대로 돌려준다', async () => {
    mockRpc.mockResolvedValue({data: ['2026-11-19', '2026-11-20'], error: null});
    await expect(getWorkoutDates()).resolves.toEqual(['2026-11-19', '2026-11-20']);
    expect(mockRpc).toHaveBeenCalledWith('get_my_workout_dates');
  });

  it('error 가 있으면 throw', async () => {
    mockRpc.mockResolvedValue({data: null, error: {message: 'function does not exist'}});
    await expect(getWorkoutDates()).rejects.toEqual({message: 'function does not exist'});
  });

  it('data 가 null 이면 []', async () => {
    mockRpc.mockResolvedValue({data: null, error: null});
    await expect(getWorkoutDates()).resolves.toEqual([]);
  });
});
