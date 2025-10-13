import {useMutation, useQueryClient} from '@tanstack/react-query';
import {savePushupSession} from '../remote/pushup';

export const useSavePushupSessionMutation = (
  onSuccess?: () => void,
  onError?: (error: any) => void,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: savePushupSession,
    onSuccess: () => {
      // 성공 시 관련 쿼리들 무효화하여 최신 데이터로 업데이트
      queryClient.invalidateQueries({queryKey: ['pushup']});
      onSuccess?.();
    },
    onError: error => {
      onError?.(error);
    },
  });
};
