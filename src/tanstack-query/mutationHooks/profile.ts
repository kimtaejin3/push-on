import {useMutation, useQueryClient} from '@tanstack/react-query';
import {supabase} from '../../lib/supabase';
import {queryKeys} from '../queryKeys';

export interface UpdateProfileData {
  nickname: string;
  target_reps_per_set: number;
  target_sets_per_day: number;
}

export const useUpdateProfileMutation = (
  userId: string,
  onSuccess?: () => void,
  onError?: (error: any) => void,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updatedData: UpdateProfileData) => {
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
    },
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
    mutationFn: async (profileData: UpdateProfileData & {id: string}) => {
      const {data, error} = await supabase
        .from('profiles')
        .upsert(profileData)
        .select()
        .single();

      if (error) {
        throw error;
      }
      return data;
    },
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
