import AsyncStorage from '@react-native-async-storage/async-storage';
import {WorkoutPlan} from '../domain/workoutSession';

export type SetsConfig = {sets: number; reps: number; rest: number};

export const SETS_LIMITS = {
  sets: {min: 1, max: 10, step: 1},
  reps: {min: 5, max: 100, step: 5},
  rest: {min: 30, max: 180, step: 15},
} as const;

export const DEFAULT_SETS_CONFIG: SetsConfig = {sets: 3, reps: 10, rest: 60};

export const SETS_PRESETS: {label: string; config: SetsConfig}[] = [
  {label: '3 × 10', config: {sets: 3, reps: 10, rest: 60}},
  {label: '5 × 15', config: {sets: 5, reps: 15, rest: 60}},
  {label: '5 × 20', config: {sets: 5, reps: 20, rest: 60}},
];

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

export const clampSetsConfig = (c: SetsConfig): SetsConfig => ({
  sets: clamp(c.sets, SETS_LIMITS.sets.min, SETS_LIMITS.sets.max),
  reps: clamp(c.reps, SETS_LIMITS.reps.min, SETS_LIMITS.reps.max),
  rest: clamp(c.rest, SETS_LIMITS.rest.min, SETS_LIMITS.rest.max),
});

const STORAGE_KEY = 'sets-config';

export const loadLastSetsConfig = async (): Promise<SetsConfig> => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return DEFAULT_SETS_CONFIG;
    }
    const parsed = JSON.parse(raw);
    if (typeof parsed?.sets !== 'number' || typeof parsed?.reps !== 'number' || typeof parsed?.rest !== 'number') {
      return DEFAULT_SETS_CONFIG;
    }
    return clampSetsConfig(parsed);
  } catch {
    return DEFAULT_SETS_CONFIG;
  }
};

export const saveLastSetsConfig = async (c: SetsConfig): Promise<void> => {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(clampSetsConfig(c)));
};

export const toWorkoutPlan = (c: SetsConfig): WorkoutPlan => ({
  sets: Array.from({length: c.sets}, () => c.reps),
  restSeconds: c.rest,
  lastIsMax: false,
});
