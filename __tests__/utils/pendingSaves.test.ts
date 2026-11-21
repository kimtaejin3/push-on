import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  PendingSave,
  addPendingSave,
  loadPendingSaves,
  removePendingSave,
} from '../../src/utils/pendingSaves';

// 실제 저장소처럼 값을 기억하는 목 — 추가 → 조회 → 삭제를 이어서 확인한다
jest.mock('@react-native-async-storage/async-storage', () => {
  const store: Record<string, string> = {};
  return {
    __store: store,
    getItem: jest.fn(async (key: string) => (key in store ? store[key] : null)),
    setItem: jest.fn(async (key: string, value: string) => {
      store[key] = value;
    }),
  };
});
const mockStore = (AsyncStorage as unknown as {__store: Record<string, string>}).__store;
const mockGet = AsyncStorage.getItem as jest.Mock;

const item = (created_at: string, reps = 9): PendingSave => ({
  userId: 'u1',
  workout_date: created_at.slice(0, 10),
  created_at,
  data: {reps, duration_seconds: 20},
});

describe('pendingSaves', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    for (const key of Object.keys(mockStore)) {
      delete mockStore[key];
    }
  });

  it('추가 → 조회 → 삭제', async () => {
    const a = item('2026-11-20T10:00:00.000Z');
    const b = item('2026-11-21T09:00:00.000Z', 12);
    await addPendingSave(a);
    await addPendingSave(b);
    await expect(loadPendingSaves()).resolves.toEqual([a, b]);

    await removePendingSave(a.created_at);
    await expect(loadPendingSaves()).resolves.toEqual([b]);
  });

  it('저장소가 비었거나 JSON 이 깨졌으면 []', async () => {
    await expect(loadPendingSaves()).resolves.toEqual([]);
    mockGet.mockResolvedValueOnce('broken');
    await expect(loadPendingSaves()).resolves.toEqual([]);
    mockGet.mockResolvedValueOnce(JSON.stringify({not: 'array'}));
    await expect(loadPendingSaves()).resolves.toEqual([]);
  });
});
