import {supabase} from '../lib/supabase';

export interface ProfileData {
  id: string;
  target_reps_per_set: number;
  target_sets_per_day: number;
  nickname: string;
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

export const checkNicknameAvailability = async (
  nickname: string,
): Promise<boolean> => {
  try {
    const {error} = await supabase
      .from('profiles')
      .select('nickname')
      .eq('nickname', nickname)
      .single();

    // 에러가 있거나 데이터가 없으면 사용 가능
    if (error && error.code === 'PGRST116') {
      return true; // 데이터가 없음 = 사용 가능
    }

    if (error) {
      throw error;
    }

    // 데이터가 있으면 중복
    return false;
  } catch (error) {
    console.error('닉네임 중복 체크 실패:', error);
    throw error;
  }
};
