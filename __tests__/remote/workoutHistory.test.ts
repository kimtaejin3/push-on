import {supabase} from '../../src/lib/supabase';
import {
  getBestSetBefore,
  getPreviousWorkoutTotal,
} from '../../src/remote/workoutHistory';

jest.mock('../../src/lib/supabase', () => ({
  supabase: {
    auth: {getUser: jest.fn()},
    from: jest.fn(),
  },
}));

const mockFrom = supabase.from as jest.Mock;
const mockGetUser = supabase.auth.getUser as jest.Mock;
const beforeIso = '2026-11-21T10:00:00.000Z';
const lookup = {
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  lt: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  maybeSingle: jest.fn(),
};
const grouped = {
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  lt: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
  mockGetUser.mockResolvedValue({data: {user: {id: 'u1'}}, error: null});
  mockFrom.mockReturnValue(lookup);
});

describe('getPreviousWorkoutTotal', () => {
  it('같은 모드의 가장 최근 운동에 속한 세트만 합산한다', async () => {
    mockFrom.mockReturnValueOnce(lookup).mockReturnValueOnce(grouped);
    lookup.maybeSingle.mockResolvedValue({
      data: {workout_id: 'w1', reps: 7},
      error: null,
    });
    grouped.lt.mockResolvedValue({
      data: [{reps: 9}, {reps: 7}],
      error: null,
    });

    await expect(getPreviousWorkoutTotal('program', beforeIso)).resolves.toBe(16);

    expect(mockFrom.mock.calls).toEqual([['pushup_sets'], ['pushup_sets']]);
    expect(lookup.eq.mock.calls).toEqual([['user_id', 'u1'], ['mode', 'program']]);
    expect(lookup.lt).toHaveBeenCalledWith('created_at', beforeIso);
    expect(lookup.order).toHaveBeenCalledWith('created_at', {ascending: false});
    expect(lookup.limit).toHaveBeenCalledWith(1);
    expect(grouped.eq.mock.calls).toEqual([
      ['user_id', 'u1'],
      ['mode', 'program'],
      ['workout_id', 'w1'],
    ]);
    expect(grouped.lt).toHaveBeenCalledWith('created_at', beforeIso);
  });

  it.each([
    ['challenge', 'w1', 0],
    ['sets', null, 7],
  ] as const)('단독 기록(%s)은 조회한 한 행의 횟수를 반환한다', async (mode, workoutId, reps) => {
    lookup.maybeSingle.mockResolvedValue({
      data: {workout_id: workoutId, reps},
      error: null,
    });

    await expect(getPreviousWorkoutTotal(mode, beforeIso)).resolves.toBe(reps);
    expect(mockFrom).toHaveBeenCalledTimes(1);
  });

  it('그룹의 세트 조회 오류를 던진다', async () => {
    const error = new Error('network');
    mockFrom.mockReturnValueOnce(lookup).mockReturnValueOnce(grouped);
    lookup.maybeSingle.mockResolvedValue({
      data: {workout_id: 'w1', reps: 7},
      error: null,
    });
    grouped.lt.mockResolvedValue({data: null, error});

    await expect(getPreviousWorkoutTotal('sets', beforeIso)).rejects.toBe(error);
  });
});

describe('getBestSetBefore', () => {
  it('모든 모드에서 기준 시각 이전의 최고 횟수를 조회한다', async () => {
    lookup.maybeSingle.mockResolvedValue({data: {reps: 18}, error: null});

    await expect(getBestSetBefore(beforeIso)).resolves.toBe(18);

    expect(mockFrom).toHaveBeenCalledWith('pushup_sets');
    expect(lookup.eq.mock.calls).toEqual([['user_id', 'u1']]);
    expect(lookup.lt).toHaveBeenCalledWith('created_at', beforeIso);
    expect(lookup.order).toHaveBeenCalledWith('reps', {ascending: false});
    expect(lookup.limit).toHaveBeenCalledWith(1);
  });
});

describe.each([
  ['직전 운동', () => getPreviousWorkoutTotal('sets', beforeIso)],
  ['최고 세트', () => getBestSetBefore(beforeIso)],
] as const)('%s 조회', (_label, getHistory) => {
  it('기록이 없으면 null을 반환한다', async () => {
    lookup.maybeSingle.mockResolvedValue({data: null, error: null});

    await expect(getHistory()).resolves.toBeNull();
  });

  it('조회 오류를 던진다', async () => {
    const error = new Error('network');
    lookup.maybeSingle.mockResolvedValue({data: null, error});

    await expect(getHistory()).rejects.toBe(error);
  });

  it('사용자를 확인할 수 없으면 기록을 조회하지 않는다', async () => {
    const error = new Error('auth');
    mockGetUser.mockResolvedValue({data: {user: null}, error});

    await expect(getHistory()).rejects.toBe(error);
    expect(mockFrom).not.toHaveBeenCalled();
  });
});
