import AsyncStorage from '@react-native-async-storage/async-storage';
import {loadAdState, saveAdState, AD_STATE_STORAGE_KEY} from '../../src/utils/adState';
import {AdState} from '../../src/domain/adFrequency';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(), setItem: jest.fn(),
}));
const mockGet = AsyncStorage.getItem as jest.Mock;
const mockSet = AsyncStorage.setItem as jest.Mock;

const now = new Date('2026-10-19T12:00:00+09:00');
const state: AdState = {date: '2026-10-19', shownToday: 1, lastShownAt: 100, completedWorkouts: 3};

describe('adState', () => {
  beforeEach(() => jest.clearAllMocks());

  it('저장 키는 ad-state 다', () => {
    expect(AD_STATE_STORAGE_KEY).toBe('ad-state');
  });
  it('저장값이 없으면 초기 상태를 돌려준다', async () => {
    mockGet.mockResolvedValue(null);
    await expect(loadAdState(now)).resolves.toEqual(
      {date: '2026-10-19', shownToday: 0, lastShownAt: null, completedWorkouts: 0});
  });
  it('깨진 JSON 이면 초기 상태로 복구한다', async () => {
    mockGet.mockResolvedValue('{not json');
    await expect(loadAdState(now)).resolves.toMatchObject({shownToday: 0, completedWorkouts: 0});
  });
  it('필드가 빠진 객체면 초기 상태로 복구한다', async () => {
    mockGet.mockResolvedValue(JSON.stringify({shownToday: 3}));
    await expect(loadAdState(now)).resolves.toMatchObject({shownToday: 0, completedWorkouts: 0});
  });
  it('날짜가 지난 저장값은 오늘 기준으로 리셋해서 돌려준다 (누적 운동 수는 유지)', async () => {
    mockGet.mockResolvedValue(JSON.stringify(
      {date: '2026-10-18', shownToday: 2, lastShownAt: 123, completedWorkouts: 7}));
    await expect(loadAdState(now)).resolves.toEqual(
      {date: '2026-10-19', shownToday: 0, lastShownAt: null, completedWorkouts: 7});
  });
  it('saveAdState 는 JSON 으로 저장한다', async () => {
    await saveAdState(state);
    expect(mockSet).toHaveBeenCalledWith('ad-state', JSON.stringify(state));
  });
});
