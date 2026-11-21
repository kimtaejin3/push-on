import {useMutation, useQueryClient} from '@tanstack/react-query';
import {abandonProgram, createProgram, updateProgram, CompletedDay, ProgramRow} from '../../remote/program';
import {ProgramState} from '../../domain/hundredPushups';
import {queryKeys} from '../queryKeys';
import {withTimeout} from '../../utils/withTimeout';

/** 이 시간 안에 응답이 없으면 실패로 보고 화면의 "다시 시도"로 넘긴다 */
const SAVE_TIMEOUT_MS = 15000;

/**
 * 저장에 성공하면 돌려받은 행으로 캐시를 즉시 바꾼다.
 * (재조회를 기다리는 사이에 낡은 completed_days 로 덮어쓰거나, 소개 화면이 잠깐 보이는 것을 막는다)
 */
const useSetCurrentProgram = () => {
  const queryClient = useQueryClient();
  return (row: ProgramRow | null) => {
    queryClient.setQueryData(queryKeys.program.current, row);
    queryClient.invalidateQueries({queryKey: queryKeys.program.all});
  };
};

export const useCreateProgramMutation = () => {
  const setCurrent = useSetCurrentProgram();
  return useMutation({
    mutationFn: ({userId, state}: {userId: string; state: ProgramState}) =>
      withTimeout(createProgram(userId, state), SAVE_TIMEOUT_MS),
    onSuccess: setCurrent,
    onError: error => console.error('프로그램 생성 실패:', error),
  });
};

export const useUpdateProgramMutation = () => {
  const setCurrent = useSetCurrentProgram();
  return useMutation({
    mutationFn: ({id, state, completedDay, existing}: {
      id: string; state: ProgramState; completedDay?: CompletedDay; existing?: CompletedDay[];
    }) => withTimeout(updateProgram(id, state, completedDay, existing), SAVE_TIMEOUT_MS),
    onSuccess: setCurrent,
    onError: error => console.error('프로그램 갱신 실패:', error),
  });
};

export const useAbandonProgramMutation = () => {
  const setCurrent = useSetCurrentProgram();
  return useMutation({
    mutationFn: (id: string) => abandonProgram(id),
    onSuccess: () => setCurrent(null),
    onError: error => console.error('프로그램 중단 실패:', error),
  });
};
