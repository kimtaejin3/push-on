import {getCurrentProgram} from '../../remote/program';
import {queryKeys} from '../queryKeys';

export const currentProgramQueryOptions = (userId: string) => ({
  queryKey: queryKeys.program.current,
  queryFn: () => getCurrentProgram(userId),
  enabled: !!userId,
});
