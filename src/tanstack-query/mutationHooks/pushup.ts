import {useMutation, useQueryClient} from '@tanstack/react-query';
import {savePushupSession} from '../../remote/pushup';
import {queryKeys} from '../queryKeys';

export const useSavePushupSessionMutation = (
  onSuccess?: () => void,
  onError?: (error: any) => void,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: savePushupSession,
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: queryKeys.pushup.all});
      onSuccess?.();
    },
    onError: error => {
      onError?.(error);
    },
  });
};
