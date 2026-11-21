import {useMutation, useQueryClient} from '@tanstack/react-query';
import {saveWorkout} from '../../remote/pushup';
import {queryKeys} from '../queryKeys';

export const useSavePushupSessionMutation = (
  onSuccess?: (status: Awaited<ReturnType<typeof saveWorkout>>) => void,
  onError?: (error: any) => void,
) => {
  const queryClient = useQueryClient();

  // 저장에 실패해도 saveWorkout 이 폰에 보관하고 성공('queued')으로 끝난다 — 화면은 그대로 다음으로 진행한다.
  // 보관한 운동의 날짜도 스트릭에 들어가야 하므로 두 경우 모두 무효화한다.
  return useMutation({
    mutationFn: saveWorkout,
    onSuccess: status => {
      queryClient.invalidateQueries({queryKey: queryKeys.pushup.all});
      onSuccess?.(status);
    },
    onError: error => {
      onError?.(error);
    },
  });
};
