import {supabase} from '../lib/supabase';
import type {PushupSetData, WorkoutMode} from './pushup';

const getUserId = async (): Promise<string> => {
  const {data, error} = await supabase.auth.getUser();
  if (error) {
    throw error;
  }
  if (!data.user) {
    throw new Error('사용자가 로그인되지 않았습니다.');
  }
  return data.user.id;
};

export const getPreviousWorkoutTotal = async (
  mode: WorkoutMode,
  beforeIso: string,
): Promise<number | null> => {
  const userId = await getUserId();
  const {data: latest, error} = await supabase
    .from('pushup_sets')
    .select('workout_id,reps')
    .eq('user_id', userId)
    .eq('mode', mode)
    .lt('created_at', beforeIso)
    .order('created_at', {ascending: false})
    .limit(1)
    .maybeSingle<Pick<PushupSetData, 'workout_id' | 'reps'>>();

  if (error) {
    throw error;
  }
  if (!latest || mode === 'challenge' || latest.workout_id === null) {
    return latest?.reps ?? null;
  }

  const {data: sets, error: setsError} = await supabase
    .from('pushup_sets')
    .select('reps')
    .eq('user_id', userId)
    .eq('mode', mode)
    .eq('workout_id', latest.workout_id)
    .lt('created_at', beforeIso);

  if (setsError) {
    throw setsError;
  }
  return sets?.length ? sets.reduce((sum, set) => sum + set.reps, 0) : null;
};

export const getBestSetBefore = async (
  beforeIso: string,
): Promise<number | null> => {
  const userId = await getUserId();
  const {data, error} = await supabase
    .from('pushup_sets')
    .select('reps')
    .eq('user_id', userId)
    .lt('created_at', beforeIso)
    .order('reps', {ascending: false})
    .limit(1)
    .maybeSingle<Pick<PushupSetData, 'reps'>>();

  if (error) {
    throw error;
  }
  return data?.reps ?? null;
};
