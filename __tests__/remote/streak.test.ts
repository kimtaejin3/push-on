import {getWorkoutDates, isMissingFunctionError, retryWorkoutDates} from '../../src/remote/streak';
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

describe('isMissingFunctionError', () => {
  it('PostgREST 가 함수를 못 찾았다(PGRST202)면 true', () => {
    expect(isMissingFunctionError({code: 'PGRST202', message: 'Could not find the function'})).toBe(true);
  });
  it('Postgres 의 undefined_function(42883)이면 true', () => {
    expect(isMissingFunctionError({code: '42883', message: 'function does not exist'})).toBe(true);
  });
  it('네트워크 오류·다른 코드·code 없는 값은 false', () => {
    expect(isMissingFunctionError(new TypeError('Network request failed'))).toBe(false);
    expect(isMissingFunctionError({code: '57014', message: 'canceling statement'})).toBe(false);
    expect(isMissingFunctionError(null)).toBe(false);
    expect(isMissingFunctionError('PGRST202')).toBe(false);
  });
});

describe('retryWorkoutDates', () => {
  it('함수가 없으면 다시 시도하지 않는다', () => {
    expect(retryWorkoutDates(0, {code: 'PGRST202'})).toBe(false);
  });
  it('다른 오류는 2번까지 다시 시도한다', () => {
    const error = new TypeError('Network request failed');
    expect(retryWorkoutDates(0, error)).toBe(true);
    expect(retryWorkoutDates(1, error)).toBe(true);
    expect(retryWorkoutDates(2, error)).toBe(false);
  });
});
