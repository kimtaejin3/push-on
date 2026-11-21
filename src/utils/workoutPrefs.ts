import AsyncStorage from '@react-native-async-storage/async-storage';

export type WorkoutPrefs = {autoNextSet: boolean};

export const DEFAULT_WORKOUT_PREFS: WorkoutPrefs = {autoNextSet: true};

const STORAGE_KEY = 'workout-prefs';

export const loadWorkoutPrefs = async (): Promise<WorkoutPrefs> => {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    const prefs = stored === null ? null : JSON.parse(stored);
    if (typeof prefs?.autoNextSet === 'boolean') {
      return {autoNextSet: prefs.autoNextSet};
    }
  } catch {
    // 읽을 수 없는 설정은 기본값으로 되돌린다.
  }
  return DEFAULT_WORKOUT_PREFS;
};

export const saveWorkoutPrefs = (prefs: WorkoutPrefs): Promise<void> =>
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
