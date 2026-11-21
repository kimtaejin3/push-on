import React from 'react';
import {act, create} from 'react-test-renderer';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {
  useAbandonProgramMutation,
  useCreateProgramMutation,
  useUpdateProgramMutation,
} from '../../src/tanstack-query/mutationHooks/program';
import {queryKeys} from '../../src/tanstack-query/queryKeys';
import {abandonProgram, createProgram, updateProgram, ProgramRow} from '../../src/remote/program';

// 자동 목은 실제 모듈(→ supabase → url-polyfill ESM)을 로드하므로 팩토리로 대체
jest.mock('../../src/remote/program', () => ({
  createProgram: jest.fn(),
  updateProgram: jest.fn(),
  abandonProgram: jest.fn(),
}));

const mockCreate = createProgram as jest.Mock;
const mockUpdate = updateProgram as jest.Mock;
const mockAbandon = abandonProgram as jest.Mock;

const state = {week: 2, day: 2, level: 3 as const, lastTestReps: 12, testDue: false, status: 'active' as const};
const oldRow: ProgramRow = {
  id: 'p1', user_id: 'u1', status: 'active', week: 2, day: 2, level: 3,
  last_test_reps: 12, test_due: false, completed_days: [], created_at: '', updated_at: '',
};
const newRow: ProgramRow = {
  ...oldRow,
  day: 3,
  completed_days: [{week: 2, day: 2, reps: [14, 16, 12, 12, 17], completed_at: 'x', passed: true}],
};

// 뮤테이션 상태 알림(notifyManager 의 setTimeout)까지 act 안에서 끝낸다
const run = (fn: () => Promise<unknown>) =>
  act(async () => {
    await fn();
    await new Promise(resolve => setTimeout(resolve, 0));
  });

async function renderHook<T>(hook: () => T, queryClient: QueryClient) {
  const result = {current: undefined as unknown as T};
  function Probe() {
    result.current = hook();
    return null;
  }
  await act(async () => {
    create(
      <QueryClientProvider client={queryClient}>
        <Probe />
      </QueryClientProvider>,
    );
  });
  return result;
}

describe('프로그램 뮤테이션은 성공 시 캐시를 즉시 갱신한다', () => {
  let queryClient: QueryClient;
  beforeEach(() => {
    jest.clearAllMocks();
    queryClient = new QueryClient({defaultOptions: {queries: {retry: false}, mutations: {retry: false}}});
    queryClient.setQueryData(queryKeys.program.current, oldRow);
  });
  afterEach(() => queryClient.clear());

  it('updateProgram 성공 시 돌려받은 행으로 캐시를 바꾼다', async () => {
    mockUpdate.mockResolvedValue(newRow);
    const hook = await renderHook(() => useUpdateProgramMutation(), queryClient);
    await run(() => hook.current.mutateAsync({id: 'p1', state}));
    expect(queryClient.getQueryData(queryKeys.program.current)).toEqual(newRow);
  });

  it('createProgram 성공 시에도 캐시에 새 행이 들어간다', async () => {
    queryClient.setQueryData(queryKeys.program.current, null);
    mockCreate.mockResolvedValue(newRow);
    const hook = await renderHook(() => useCreateProgramMutation(), queryClient);
    await run(() => hook.current.mutateAsync({userId: 'u1', state}));
    expect(queryClient.getQueryData(queryKeys.program.current)).toEqual(newRow);
  });

  it('abandonProgram 성공 시 캐시가 null 이 된다', async () => {
    mockAbandon.mockResolvedValue(undefined);
    const hook = await renderHook(() => useAbandonProgramMutation(), queryClient);
    await run(() => hook.current.mutateAsync('p1'));
    expect(queryClient.getQueryData(queryKeys.program.current)).toBeNull();
  });
});
