import {supabase} from '../lib/supabase';
import {generateRandomNickname} from '../utils/nickname';

export interface ProfileData {
  id: string;
  nickname: string;
  created_at: string;
  updated_at: string;
}

/**
 * 프로필 조회. 행이 없으면 null.
 */
export const findProfile = async (
  userId: string,
): Promise<ProfileData | null> => {
  const {data, error} = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw error;
  }
  return data;
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

const UNIQUE_VIOLATION = '23505';
const CREATE_PROFILE_MAX_ATTEMPTS = 3;

/**
 * 가입 직후 랜덤 닉네임(user-xxxxxxxx)으로 프로필을 만든다.
 * 닉네임이 우연히 겹치면(unique 위반) 새 닉네임으로 다시 시도한다.
 */
export const createDefaultProfile = async (
  userId: string,
): Promise<ProfileData> => {
  let lastError: unknown = null;
  for (let attempt = 0; attempt < CREATE_PROFILE_MAX_ATTEMPTS; attempt++) {
    const {data, error} = await supabase
      .from('profiles')
      .insert({
        id: userId,
        nickname: generateRandomNickname(),
        // DB 컬럼 호환용. 구버전 앱이 사라진 뒤 컬럼과 함께 제거 예정
        // (UPDATE_APP_VERSION_1.6.0.sql 의 DROP NOT NULL 실행 후에는 지워도 됨)
        target_reps_per_set: 10,
      })
      .select()
      .single();

    if (!error) {
      return data;
    }
    lastError = error;
    if (error.code !== UNIQUE_VIOLATION) {
      break;
    }
  }
  console.error('기본 프로필 생성 실패:', lastError);
  throw lastError;
};
