import {getCurrentProgram, createProgram, updateProgram, toProgramState, ProgramRow} from '../../src/remote/program';
import {supabase} from '../../src/lib/supabase';

jest.mock('../../src/lib/supabase', () => ({supabase: {from: jest.fn()}}));
const mockFrom = supabase.from as jest.Mock;

const row: ProgramRow = {
  id: 'p1', user_id: 'u1', status: 'active', week: 2, day: 3, level: 1,
  last_test_reps: 4, test_due: true, completed_days: [], created_at: '', updated_at: '',
};

describe('remote/program', () => {
  beforeEach(() => jest.clearAllMocks());

  it('getCurrentProgram 은 가장 최근에 만든 프로그램 한 건을 돌려준다', async () => {
    const maybeSingle = jest.fn().mockResolvedValue({data: row, error: null});
    const limit = jest.fn(() => ({maybeSingle}));
    const order = jest.fn(() => ({limit}));
    const eq = jest.fn(() => ({order}));
    mockFrom.mockReturnValue({select: () => ({eq})});
    await expect(getCurrentProgram('u1')).resolves.toEqual(row);
    expect(eq).toHaveBeenCalledWith('user_id', 'u1');
    expect(order).toHaveBeenCalledWith('created_at', {ascending: false});
    expect(limit).toHaveBeenCalledWith(1);

    maybeSingle.mockResolvedValue({data: {...row, status: 'completed'}, error: null});
    await expect(getCurrentProgram('u1')).resolves.toMatchObject({status: 'completed'});
    maybeSingle.mockResolvedValue({data: {...row, status: 'abandoned'}, error: null});
    await expect(getCurrentProgram('u1')).resolves.toBeNull(); // 최신이 그만둔 것이면 없는 것
    maybeSingle.mockResolvedValue({data: null, error: null});
    await expect(getCurrentProgram('u1')).resolves.toBeNull();
  });

  it('createProgram 은 상태를 컬럼으로 바꿔 insert 한다', async () => {
    const single = jest.fn().mockResolvedValue({data: row, error: null});
    const insert = jest.fn(() => ({select: () => ({single})}));
    mockFrom.mockReturnValue({insert});
    await createProgram('u1', {week: 1, day: 1, level: 2, lastTestReps: 8, testDue: false, status: 'active'});
    expect(insert).toHaveBeenCalledWith({user_id: 'u1', week: 1, day: 1, level: 2, last_test_reps: 8, test_due: false, status: 'active'});
  });

  it('updateProgram 은 완료한 날을 completed_days 에 덧붙인다', async () => {
    const single = jest.fn().mockResolvedValue({data: row, error: null});
    const eq = jest.fn(() => ({select: () => ({single})}));
    const update = jest.fn(() => ({eq}));
    mockFrom.mockReturnValue({update});
    await updateProgram(
      'p1',
      {week: 1, day: 2, level: 2, lastTestReps: 8, testDue: false, status: 'active'},
      {week: 1, day: 1, reps: [6, 6, 4, 4, 7], completed_at: '2026-08-30T00:00:00.000Z'},
      [],
    );
    const patch = (update.mock.calls[0] as unknown[])[0] as Record<string, unknown>;
    expect(patch).toMatchObject({week: 1, day: 2, level: 2, test_due: false});
    expect(patch.completed_days).toEqual([{week: 1, day: 1, reps: [6, 6, 4, 4, 7], completed_at: '2026-08-30T00:00:00.000Z'}]);
    expect(eq).toHaveBeenCalledWith('id', 'p1');
  });

  it('toProgramState 는 row → state', () => {
    expect(toProgramState(row)).toEqual({week: 2, day: 3, level: 1, lastTestReps: 4, testDue: true, status: 'active'});
  });
});
