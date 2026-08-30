import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  SETS_PRESETS, DEFAULT_SETS_CONFIG, clampSetsConfig, loadLastSetsConfig, saveLastSetsConfig, toWorkoutPlan,
} from '../../src/utils/setsPreset';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(), setItem: jest.fn(),
}));
const mockGet = AsyncStorage.getItem as jest.Mock;
const mockSet = AsyncStorage.setItem as jest.Mock;

describe('setsPreset', () => {
  beforeEach(() => jest.clearAllMocks());

  it('프리셋은 3×10 / 5×15 / 5×20 이고 기본값은 3×10 휴식 60', () => {
    expect(SETS_PRESETS.map(p => p.label)).toEqual(['3 × 10', '5 × 15', '5 × 20']);
    expect(DEFAULT_SETS_CONFIG).toEqual({sets: 3, reps: 10, rest: 60});
  });

  it('범위를 벗어나면 잘라낸다 (세트 1–10, 목표 5–100, 휴식 30–180)', () => {
    expect(clampSetsConfig({sets: 0, reps: 3, rest: 10})).toEqual({sets: 1, reps: 5, rest: 30});
    expect(clampSetsConfig({sets: 11, reps: 200, rest: 999})).toEqual({sets: 10, reps: 100, rest: 180});
  });

  it('저장된 설정이 없거나 깨져 있으면 기본값', async () => {
    mockGet.mockResolvedValueOnce(null);
    await expect(loadLastSetsConfig()).resolves.toEqual(DEFAULT_SETS_CONFIG);
    mockGet.mockResolvedValueOnce('not json');
    await expect(loadLastSetsConfig()).resolves.toEqual(DEFAULT_SETS_CONFIG);
  });

  it('저장·복원 시 범위 보정을 거친다', async () => {
    await saveLastSetsConfig({sets: 5, reps: 20, rest: 90});
    expect(mockSet).toHaveBeenCalledWith('sets-config', JSON.stringify({sets: 5, reps: 20, rest: 90}));
    mockGet.mockResolvedValueOnce(JSON.stringify({sets: 50, reps: 20, rest: 90}));
    await expect(loadLastSetsConfig()).resolves.toEqual({sets: 10, reps: 20, rest: 90});
  });

  it('toWorkoutPlan 은 세트 수만큼 목표를 펼치고 max 세트 없음', () => {
    expect(toWorkoutPlan({sets: 3, reps: 10, rest: 60})).toEqual({sets: [10, 10, 10], restSeconds: 60, lastIsMax: false});
  });
});
