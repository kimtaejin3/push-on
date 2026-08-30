import {useMutation, useQueryClient} from '@tanstack/react-query';
import {abandonProgram, createProgram, updateProgram, CompletedDay} from '../../remote/program';
import {ProgramState} from '../../domain/hundredPushups';
import {queryKeys} from '../queryKeys';

const useInvalidateProgram = () => {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({queryKey: queryKeys.program.all});
};

export const useCreateProgramMutation = () => {
  const invalidate = useInvalidateProgram();
  return useMutation({
    mutationFn: ({userId, state}: {userId: string; state: ProgramState}) => createProgram(userId, state),
    onSuccess: invalidate,
    onError: error => console.error('프로그램 생성 실패:', error),
  });
};

export const useUpdateProgramMutation = () => {
  const invalidate = useInvalidateProgram();
  return useMutation({
    mutationFn: ({id, state, completedDay, existing}: {
      id: string; state: ProgramState; completedDay?: CompletedDay; existing?: CompletedDay[];
    }) => updateProgram(id, state, completedDay, existing),
    onSuccess: invalidate,
    onError: error => console.error('프로그램 갱신 실패:', error),
  });
};

export const useAbandonProgramMutation = () => {
  const invalidate = useInvalidateProgram();
  return useMutation({
    mutationFn: (id: string) => abandonProgram(id),
    onSuccess: invalidate,
    onError: error => console.error('프로그램 중단 실패:', error),
  });
};
