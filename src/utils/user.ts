import {User} from '@supabase/supabase-js';
import {ProviderInfo} from '../types/auth';
import {colors} from '../constants/colors';

export const getProviderInfo = (providerType: string): ProviderInfo => {
  switch (providerType) {
    case 'kakao':
      return {
        name: '카카오',
        icon: 'comment',
        color: '#FEE500',
      };
    case 'google':
      return {
        name: '구글',
        icon: 'search',
        color: colors.primary,
      };
    default:
      return {
        name: '이메일',
        icon: 'envelope',
        color: colors.primary,
      };
  }
};

export const extractUserInfo = (user: User) => {
  const userName =
    user.user_metadata.name || user.user_metadata.full_name || '사용자';
  const userEmail = user.email || '';

  const rawProfileImage = user.user_metadata.avatar_url || '';
  let profileImage = '';

  if (rawProfileImage) {
    if (rawProfileImage.includes('fname=')) {
      try {
        const fnamePart = rawProfileImage.split('fname=')[1];
        profileImage = decodeURIComponent(fnamePart);
      } catch (error) {
        profileImage = rawProfileImage;
      }
    } else {
      profileImage = rawProfileImage;
    }

    if (profileImage.startsWith('http://')) {
      profileImage = profileImage.replace('http://', 'https://');
    }
  }

  const provider = user.app_metadata.provider || 'unknown';
  const joinedDate = user.created_at
    ? new Date(user.created_at).toLocaleDateString('ko-KR')
    : '';

  return {
    userName,
    userEmail,
    profileImage,
    providerInfo: getProviderInfo(provider),
    joinedDate,
  };
};
