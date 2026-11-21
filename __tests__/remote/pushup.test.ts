import {flushPendingSaves, onPendingFlushed, savePushupSession, saveWorkout} from '../../src/remote/pushup';
import {supabase} from '../../src/lib/supabase';
import {addPendingSave, loadPendingSaves, removePendingSave} from '../../src/utils/pendingSaves';

jest.mock('../../src/lib/supabase', () => ({
  supabase: {auth: {getUser: jest.fn(), getSession: jest.fn()}, from: jest.fn(), rpc: jest.fn()},
}));
jest.mock('../../src/utils/pendingSaves', () => ({
  loadPendingSaves: jest.fn(),
  addPendingSave: jest.fn(),
  removePendingSave: jest.fn(),
}));

const mockFrom = supabase.from as jest.Mock;
const mockGetUser = supabase.auth.getUser as jest.Mock;
const mockGetSession = supabase.auth.getSession as jest.Mock;
const mockRpc = supabase.rpc as jest.Mock;
const mockLoadPending = loadPendingSaves as jest.Mock;
const mockAddPending = addPendingSave as jest.Mock;
const mockRemovePending = removePendingSave as jest.Mock;

let insert: jest.Mock;
// pushup_sets 에서 user_id·created_at 으로 한 건을 찾는 조회의 결과
let existing: {data: unknown; error: unknown};
const mockExisting = (row: unknown) => {
  existing = {data: row, error: null};
};

beforeEach(() => {
  jest.clearAllMocks();
  mockGetUser.mockResolvedValue({data: {user: {id: 'u1'}}});
  mockGetSession.mockResolvedValue({data: {session: {user: {id: 'u1'}}}});
  insert = jest.fn().mockResolvedValue({error: null});
  existing = {data: null, error: null};
  const lookup: Record<string, jest.Mock> = {};
  lookup.select = jest.fn(() => lookup);
  lookup.eq = jest.fn(() => lookup);
  lookup.limit = jest.fn(() => lookup);
  lookup.maybeSingle = jest.fn(async () => existing);
  mockFrom.mockReturnValue({insert, select: lookup.select});
  mockRpc.mockResolvedValue({error: null});
  mockLoadPending.mockResolvedValue([]);
  mockAddPending.mockResolvedValue(undefined);
  mockRemovePending.mockResolvedValue(undefined);
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

const pending = (created_at: string, reps: number, userId = 'u1') => ({
  userId,
  workout_date: created_at.slice(0, 10),
  created_at,
  data: {reps, duration_seconds: 5},
});

describe('savePushupSession', () => {
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

  it('stamp 가 오면 그 날짜·시각으로 기록한다', async () => {
    await savePushupSession({reps: 5, duration_seconds: 10}, {workout_date: '2026-11-19', created_at: '2026-11-19T08:00:00.000Z'});
    expect(insert.mock.calls[0][0]).toMatchObject({workout_date: '2026-11-19', created_at: '2026-11-19T08:00:00.000Z'});
  });
});

describe('saveWorkout / flushPendingSaves', () => {
  it('saveWorkout: 저장에 성공하면 saved, 보관하지 않는다', async () => {
    await expect(saveWorkout({reps: 12, duration_seconds: 30})).resolves.toBe('saved');
    expect(mockAddPending).not.toHaveBeenCalled();
  });
  it('saveWorkout: 저장에 실패하면 날짜·시각과 함께 보관하고 queued', async () => {
    insert.mockResolvedValue({error: {message: 'network'}});
    await expect(saveWorkout({reps: 12, duration_seconds: 30, mode: 'sets'})).resolves.toBe('queued');
    const saved = mockAddPending.mock.calls[0][0];
    expect(saved).toMatchObject({userId: 'u1', data: {reps: 12, duration_seconds: 30, mode: 'sets'}});
    expect(saved.workout_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(typeof saved.created_at).toBe('string');
  });
  it('saveWorkout: 로그인 안 됐으면 throw (보관할 계정이 없다)', async () => {
    mockGetSession.mockResolvedValue({data: {session: null}});
    await expect(saveWorkout({reps: 12, duration_seconds: 30})).rejects.toThrow();
    expect(mockAddPending).not.toHaveBeenCalled();
  });
  it('saveWorkout: 오프라인이라 서버가 사용자를 확인하지 못해도 저장된 세션의 계정으로 보관한다', async () => {
    mockGetUser.mockResolvedValue({data: {user: null}, error: {message: 'network'}});
    await expect(saveWorkout({reps: 3, duration_seconds: 5})).resolves.toBe('queued');
    expect(mockAddPending.mock.calls[0][0]).toMatchObject({userId: 'u1'});
  });
  it('flushPendingSaves: 서버에 없는 것은 원래 날짜·시각으로 다시 보내고 지운다', async () => {
    mockLoadPending.mockResolvedValue([{userId: 'u1', workout_date: '2026-11-20', created_at: '2026-11-20T10:00:00.000Z', data: {reps: 9, duration_seconds: 20}}]);
    mockExisting(null); // 같은 user_id + created_at 행이 없다
    await expect(flushPendingSaves()).resolves.toBe(1);
    expect(insert.mock.calls[0][0]).toMatchObject({user_id: 'u1', workout_date: '2026-11-20', created_at: '2026-11-20T10:00:00.000Z', reps: 9});
    expect(mockRemovePending).toHaveBeenCalledWith('2026-11-20T10:00:00.000Z');
  });
  it('flushPendingSaves: 이미 서버에 있으면 다시 넣지 않고 지우기만 한다 (중복 방지)', async () => {
    mockLoadPending.mockResolvedValue([{userId: 'u1', workout_date: '2026-11-20', created_at: '2026-11-20T10:00:00.000Z', data: {reps: 9, duration_seconds: 20}}]);
    mockExisting({id: 'x'});
    await flushPendingSaves();
    expect(insert).not.toHaveBeenCalled();
    expect(mockRpc).not.toHaveBeenCalled();
    expect(mockRemovePending).toHaveBeenCalledWith('2026-11-20T10:00:00.000Z');
  });
  it('flushPendingSaves: 다른 계정의 보관분은 보내지도 지우지도 않는다', async () => {
    mockLoadPending.mockResolvedValue([{userId: 'someone-else', workout_date: '2026-11-20', created_at: '2026-11-20T10:00:00.000Z', data: {reps: 9, duration_seconds: 20}}]);
    await expect(flushPendingSaves()).resolves.toBe(0);
    expect(insert).not.toHaveBeenCalled();
    expect(mockRemovePending).not.toHaveBeenCalled();
  });
  it('flushPendingSaves: 다시 보내기도 실패하면 남겨 둔다', async () => {
    mockLoadPending.mockResolvedValue([{userId: 'u1', workout_date: '2026-11-20', created_at: '2026-11-20T10:00:00.000Z', data: {reps: 9, duration_seconds: 20}}]);
    mockExisting(null);
    insert.mockResolvedValue({error: {message: 'network'}});
    await expect(flushPendingSaves()).resolves.toBe(0);
    expect(mockRemovePending).not.toHaveBeenCalled();
  });
  it('flushPendingSaves: 오래된 것부터 보낸다', async () => {
    mockLoadPending.mockResolvedValue([
      {userId: 'u1', workout_date: '2026-11-21', created_at: '2026-11-21T10:00:00.000Z', data: {reps: 2, duration_seconds: 5}},
      {userId: 'u1', workout_date: '2026-11-20', created_at: '2026-11-20T10:00:00.000Z', data: {reps: 1, duration_seconds: 5}},
    ]);
    await expect(flushPendingSaves()).resolves.toBe(2);
    expect(insert.mock.calls.map(c => c[0].reps)).toEqual([1, 2]);
  });
  it('saveWorkout: 보관분 재전송을 기다리지 않고 바로 saved', async () => {
    let release: (items: never[]) => void = () => {};
    mockLoadPending.mockReturnValue(new Promise(resolve => (release = resolve))); // 재전송이 끝나지 않는다
    await expect(saveWorkout({reps: 12, duration_seconds: 30})).resolves.toBe('saved');
    release([]); // 다음 테스트를 위해 진행 중인 재전송을 끝낸다
    await flushPendingSaves();
  });
  it('saveWorkout: 뒤에서 도는 재전송이 throw 해도 saved', async () => {
    mockLoadPending.mockRejectedValue(new Error('storage'));
    await expect(saveWorkout({reps: 12, duration_seconds: 30})).resolves.toBe('saved');
    await new Promise(resolve => setImmediate(resolve)); // 처리되지 않은 거부가 없어야 한다
  });
  it('flushPendingSaves: 하나라도 보냈으면 등록된 리스너에 알린다', async () => {
    const listener = jest.fn();
    const off = onPendingFlushed(listener);
    mockLoadPending.mockResolvedValue([pending('2026-11-20T10:00:00.000Z', 9)]);
    await flushPendingSaves();
    expect(listener).toHaveBeenCalledWith(1);
    listener.mockClear();
    mockLoadPending.mockResolvedValue([]);
    await flushPendingSaves();
    expect(listener).not.toHaveBeenCalled();
    off();
  });
  it('flushPendingSaves: 존재 확인 조회가 실패하면 넣지도 지우지도 않는다', async () => {
    mockLoadPending.mockResolvedValue([pending('2026-11-20T10:00:00.000Z', 9)]);
    existing = {data: null, error: {message: 'network'}};
    await expect(flushPendingSaves()).resolves.toBe(0);
    expect(insert).not.toHaveBeenCalled();
    expect(mockRemovePending).not.toHaveBeenCalled();
  });
  it('flushPendingSaves: 중간에 실패하면 멈추고 나머지는 남겨 둔다', async () => {
    mockLoadPending.mockResolvedValue([
      pending('2026-11-20T10:00:00.000Z', 1),
      pending('2026-11-20T11:00:00.000Z', 2),
      pending('2026-11-20T12:00:00.000Z', 3),
    ]);
    insert.mockResolvedValueOnce({error: null}).mockResolvedValueOnce({error: {message: 'network'}});
    await expect(flushPendingSaves()).resolves.toBe(1);
    expect(insert).toHaveBeenCalledTimes(2);
    expect(mockRemovePending.mock.calls).toEqual([['2026-11-20T10:00:00.000Z']]);
  });
  it('flushPendingSaves: 도중에 계정이 바뀌면 멈추고 다른 계정으로 넣지 않는다', async () => {
    mockLoadPending.mockResolvedValue([
      pending('2026-11-20T10:00:00.000Z', 1),
      pending('2026-11-20T11:00:00.000Z', 2),
    ]);
    // 첫 건을 보낸 뒤 로그아웃 → 다른 계정으로 로그인
    mockRemovePending.mockImplementationOnce(async () => {
      mockGetSession.mockResolvedValue({data: {session: {user: {id: 'u2'}}}});
      mockGetUser.mockResolvedValue({data: {user: {id: 'u2'}}});
    });
    await expect(flushPendingSaves()).resolves.toBe(1);
    expect(insert).toHaveBeenCalledTimes(1);
    expect(insert.mock.calls[0][0]).toMatchObject({user_id: 'u1', reps: 1});
    expect(mockRemovePending).toHaveBeenCalledTimes(1);
  });
  it('flushPendingSaves: 넣기 직전 서버가 다른 계정을 돌려주면 넣지 않고 남겨 둔다', async () => {
    mockLoadPending.mockResolvedValue([pending('2026-11-20T10:00:00.000Z', 1)]);
    mockGetUser.mockResolvedValue({data: {user: {id: 'u2'}}});
    await expect(flushPendingSaves()).resolves.toBe(0);
    expect(insert).not.toHaveBeenCalled();
    expect(mockRemovePending).not.toHaveBeenCalled();
  });
  it('flushPendingSaves: 로그인 안 됐으면 아무것도 하지 않는다', async () => {
    mockGetSession.mockResolvedValue({data: {session: null}});
    mockLoadPending.mockResolvedValue([{userId: 'u1', workout_date: '2026-11-20', created_at: '2026-11-20T10:00:00.000Z', data: {reps: 9, duration_seconds: 20}}]);
    await expect(flushPendingSaves()).resolves.toBe(0);
    expect(insert).not.toHaveBeenCalled();
  });
});
