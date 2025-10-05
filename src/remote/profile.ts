import {supabase} from '../lib/supabase';

export interface ProfileData {
  id: string;
  target_reps_per_set: number;
  target_sets_per_day: number;
  created_at: string;
  updated_at: string;
}

export const getProfile = async (userId: string): Promise<ProfileData> => {
  try {
    const {data, error} = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      throw error;
    }

    return data || {};
  } catch (error) {
    console.error('프로필 조회 실패:', error);
    throw error;
  }
};
