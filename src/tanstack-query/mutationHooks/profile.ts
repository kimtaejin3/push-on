import {useMutation, useQueryClient} from '@tanstack/react-query';
import {
  updateProfile,
  upsertProfile,
  UpdateProfileData,
} from '../../remote/profile';
import {queryKeys} from '../queryKeys';

export const useUpdateProfileMutation = (
  userId: string,
  onSuccess?: () => void,
  onError?: (error: any) => void,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (updatedData: UpdateProfileData) =>
      updateProfile(userId, updatedData),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: queryKeys.profile.me});
      onSuccess?.();
    },
    onError: error => {
      console.error('프로필 업데이트 실패:', (error as Error).message);
      onError?.(error);
    },
  });
};

export const useUpsertProfileMutation = (
  onSuccess?: () => void,
  onError?: (error: any) => void,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: upsertProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: queryKeys.profile.me});
      onSuccess?.();
    },
    onError: error => {
      console.error('프로필 생성/업데이트 실패:', (error as Error).message);
      onError?.(error);
    },
  });
};
