import {getActiveProgram, createProgram, updateProgram, toProgramState, ProgramRow} from '../../src/remote/program';
import {supabase} from '../../src/lib/supabase';

jest.mock('../../src/lib/supabase', () => ({supabase: {from: jest.fn()}}));
const mockFrom = supabase.from as jest.Mock;

const row: ProgramRow = {
  id: 'p1', user_id: 'u1', status: 'active', week: 2, day: 3, level: 1,
  last_test_reps: 4, test_due: true, completed_days: [], created_at: '', updated_at: '',
};

describe('remote/program', () => {
  beforeEach(() => jest.clearAllMocks());

  it('getActiveProgram 은 active 행을 돌려주고 없으면 null', async () => {
    const maybeSingle = jest.fn().mockResolvedValue({data: row, error: null});
    const eq2 = jest.fn(() => ({maybeSingle}));
    const eq1 = jest.fn(() => ({eq: eq2}));
    mockFrom.mockReturnValue({select: () => ({eq: eq1})});
    await expect(getActiveProgram('u1')).resolves.toEqual(row);
    expect(eq1).toHaveBeenCalledWith('user_id', 'u1');
    expect(eq2).toHaveBeenCalledWith('status', 'active');

    maybeSingle.mockResolvedValue({data: null, error: null});
    await expect(getActiveProgram('u1')).resolves.toBeNull();
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
