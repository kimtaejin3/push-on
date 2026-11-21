import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  loadStreakReminder,
  saveStreakReminder,
  loadLastCelebrated,
  saveLastCelebrated,
} from '../../src/utils/streakStorage';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(), setItem: jest.fn(),
}));
const mockGet = AsyncStorage.getItem as jest.Mock;
const mockSet = AsyncStorage.setItem as jest.Mock;

describe('streak reminder settings', () => {
  beforeEach(() => jest.clearAllMocks());

  it('저장된 값이 없으면 기본값: 꺼짐, 21:00', async () => {
    mockGet.mockResolvedValueOnce(null);
    await expect(loadStreakReminder()).resolves.toEqual({enabled: false, hour: 21, minute: 0});
  });

  it('저장된 값이 깨져 있으면 기본값', async () => {
    mockGet.mockResolvedValueOnce('broken');
    await expect(loadStreakReminder()).resolves.toEqual({enabled: false, hour: 21, minute: 0});
    mockGet.mockResolvedValueOnce(JSON.stringify({hour: 9}));
    await expect(loadStreakReminder()).resolves.toEqual({enabled: false, hour: 21, minute: 0});
  });

  it('저장된 설정은 그대로 읽힌다', async () => {
    mockGet.mockResolvedValueOnce(JSON.stringify({enabled: true, hour: 19, minute: 30}));
    await expect(loadStreakReminder()).resolves.toEqual({enabled: true, hour: 19, minute: 30});
  });

  it('저장 시 시 0-23, 분 0-59 로 보정한다', async () => {
    await saveStreakReminder({enabled: true, hour: 30, minute: -5});
    expect(mockSet).toHaveBeenCalledTimes(1);
    const [, raw] = mockSet.mock.calls[0];
    expect(JSON.parse(raw)).toEqual({enabled: true, hour: 23, minute: 0});
  });

  it('저장한 값을 다시 읽을 수 있다', async () => {
    await saveStreakReminder({enabled: true, hour: 7, minute: 15});
    const [key, raw] = mockSet.mock.calls[0];
    mockGet.mockImplementation(async (k: string) => (k === key ? raw : null));
    await expect(loadStreakReminder()).resolves.toEqual({enabled: true, hour: 7, minute: 15});
    mockGet.mockReset();
  });
});

describe('last celebrated date', () => {
  beforeEach(() => jest.clearAllMocks());

  it('저장된 값이 없으면 null', async () => {
    mockGet.mockResolvedValueOnce(null);
    await expect(loadLastCelebrated()).resolves.toBeNull();
  });

  it('저장한 날짜를 그대로 읽는다', async () => {
    await saveLastCelebrated('2026-11-21');
    const [key, value] = mockSet.mock.calls[0];
    expect(value).toBe('2026-11-21');
    mockGet.mockImplementation(async (k: string) => (k === key ? value : null));
    await expect(loadLastCelebrated()).resolves.toBe('2026-11-21');
    mockGet.mockReset();
  });

  it('읽기에 실패하면 null', async () => {
    mockGet.mockRejectedValueOnce(new Error('io'));
    await expect(loadLastCelebrated()).resolves.toBeNull();
  });
});
