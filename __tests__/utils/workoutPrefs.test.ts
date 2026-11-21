import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  DEFAULT_WORKOUT_PREFS,
  loadWorkoutPrefs,
  saveWorkoutPrefs,
} from '../../src/utils/workoutPrefs';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

const mockGet = jest.mocked(AsyncStorage.getItem);
const mockSet = jest.mocked(AsyncStorage.setItem);

describe('운동 설정', () => {
  it('설정이 없으면 다음 세트 자동 시작이 켜져 있다', async () => {
    mockGet.mockResolvedValueOnce(null);
    expect(DEFAULT_WORKOUT_PREFS).toEqual({autoNextSet: true});
    await expect(loadWorkoutPrefs()).resolves.toEqual({autoNextSet: true});
  });

  it.each(['broken', 'null', '{"autoNextSet":"false"}'])(
    '깨진 값(%s)은 기본값으로 되돌린다',
    async stored => {
      mockGet.mockResolvedValueOnce(stored);
      await expect(loadWorkoutPrefs()).resolves.toEqual({autoNextSet: true});
    },
  );

  it('다음 세트 자동 시작을 끄면 다시 읽을 때도 꺼져 있다', async () => {
    const storage = new Map<string, string>();
    mockSet.mockImplementationOnce(async (key, value) => {
      storage.set(key, value);
    });
    mockGet.mockImplementationOnce(async key => storage.get(key) ?? null);

    await saveWorkoutPrefs({autoNextSet: false});
    await expect(loadWorkoutPrefs()).resolves.toEqual({autoNextSet: false});
  });

  it('설정을 읽을 수 없으면 기본값을 쓴다', async () => {
    mockGet.mockRejectedValueOnce(new Error('읽기 실패'));
    await expect(loadWorkoutPrefs()).resolves.toEqual({autoNextSet: true});
  });
});
