import AsyncStorage from '@react-native-async-storage/async-storage';
import {AdState, createAdState, rollDate} from '../domain/adFrequency';

export const AD_STATE_STORAGE_KEY = 'ad-state';

/**
 * 저장된 전면광고 노출 기록. 없거나 깨졌으면 초기 상태로 시작하고,
 * 날짜가 지났으면 오늘 노출 기록만 초기화한다(누적 운동 수는 유지).
 */
export const loadAdState = async (now: Date = new Date()): Promise<AdState> => {
  try {
    const raw = await AsyncStorage.getItem(AD_STATE_STORAGE_KEY);
    if (!raw) {
      return createAdState(now);
    }
    const parsed = JSON.parse(raw);
    if (
      typeof parsed?.date !== 'string' ||
      typeof parsed?.shownToday !== 'number' ||
      typeof parsed?.completedWorkouts !== 'number'
    ) {
      return createAdState(now);
    }
    return rollDate(parsed as AdState, now);
  } catch {
    return createAdState(now);
  }
};

export const saveAdState = async (state: AdState): Promise<void> => {
  await AsyncStorage.setItem(AD_STATE_STORAGE_KEY, JSON.stringify(state));
};
