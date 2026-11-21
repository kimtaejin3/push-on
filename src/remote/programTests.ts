import {supabase} from '../lib/supabase';
import type {PushupSetData} from './pushup';

export async function getInitialTestReps(
  programCreatedAtIso: string,
): Promise<number | null> {
  const {data: auth, error: authError} = await supabase.auth.getUser();
  if (authError) {
    throw authError;
  }
  if (!auth.user) {
    throw new Error('사용자가 로그인되지 않았습니다.');
  }

  const {data, error} = await supabase
    .from('pushup_sets')
    .select('reps')
    .eq('user_id', auth.user.id)
    .eq('mode', 'program_test')
    .lte('created_at', programCreatedAtIso)
    .order('created_at', {ascending: false})
    .limit(1)
    .maybeSingle<Pick<PushupSetData, 'reps'>>();

  if (error) {
    throw error;
  }
  return data?.reps ?? null;
}
