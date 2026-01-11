import {supabase} from '../lib/supabase';

export interface ProfileData {
  id: string;
  target_reps_per_set: number;
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

    if (error && error.code !== 'PGRST116') {
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

export interface UpdateProfileData {
  nickname: string;
  target_reps_per_set: number;
}

/**
 * 프로필 업데이트 API
 * 기존 프로필 정보를 수정합니다.
 */
export const updateProfile = async (
  userId: string,
  updatedData: UpdateProfileData,
): Promise<ProfileData> => {
  try {
    const {data, error} = await supabase
      .from('profiles')
      .update(updatedData)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      throw error;
    }
    return data;
  } catch (error) {
    console.error('프로필 업데이트 실패:', error);
    throw error;
  }
};

/**
 * 프로필 생성/업데이트 API (Upsert)
 * 프로필이 없으면 생성하고, 있으면 업데이트합니다.
 */
export const upsertProfile = async (
  profileData: UpdateProfileData & {id: string},
): Promise<ProfileData> => {
  try {
    const {data, error} = await supabase
      .from('profiles')
      .upsert(profileData)
      .select()
      .single();

    if (error) {
      throw error;
    }
    return data;
  } catch (error) {
    console.error('프로필 생성/업데이트 실패:', error);
    throw error;
  }
};
