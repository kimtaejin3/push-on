import {supabase} from '../../src/lib/supabase';
import {getInitialTestReps} from '../../src/remote/programTests';

jest.mock('../../src/lib/supabase', () => ({
  supabase: {auth: {getUser: jest.fn()}, from: jest.fn()},
}));

const from = supabase.from as jest.Mock;
const getUser = supabase.auth.getUser as jest.Mock;
const programCreatedAt = '2026-11-21T10:00:00.000Z';
const lookup = {
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  lte: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  maybeSingle: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
  getUser.mockResolvedValue({data: {user: {id: 'u1'}}, error: null});
  from.mockReturnValue(lookup);
});

it('프로그램 생성 시각 이하의 가장 최근 프로그램 테스트 한 건을 읽는다', async () => {
  lookup.maybeSingle.mockResolvedValue({data: {reps: 12}, error: null});

  await expect(getInitialTestReps(programCreatedAt)).resolves.toBe(12);

  expect(from).toHaveBeenCalledWith('pushup_sets');
  expect(lookup.select).toHaveBeenCalledWith('reps');
  expect(lookup.eq.mock.calls).toEqual([
    ['user_id', 'u1'],
    ['mode', 'program_test'],
  ]);
  expect(lookup.lte).toHaveBeenCalledWith('created_at', programCreatedAt);
  expect(lookup.order).toHaveBeenCalledWith('created_at', {ascending: false});
  expect(lookup.limit).toHaveBeenCalledWith(1);
});

it('테스트 기록이 없으면 null을 반환한다', async () => {
  lookup.maybeSingle.mockResolvedValue({data: null, error: null});
  await expect(getInitialTestReps(programCreatedAt)).resolves.toBeNull();
});

it('조회 오류를 그대로 던진다', async () => {
  const error = new Error('network');
  lookup.maybeSingle.mockResolvedValue({data: null, error});
  await expect(getInitialTestReps(programCreatedAt)).rejects.toBe(error);
});

it('인증 오류가 나면 기록을 조회하지 않는다', async () => {
  const error = new Error('auth');
  getUser.mockResolvedValue({data: {user: null}, error});
  await expect(getInitialTestReps(programCreatedAt)).rejects.toBe(error);
  expect(from).not.toHaveBeenCalled();
});
