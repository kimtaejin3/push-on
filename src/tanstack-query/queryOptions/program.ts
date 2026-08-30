import {getActiveProgram} from '../../remote/program';
import {queryKeys} from '../queryKeys';

export const activeProgramQueryOptions = (userId: string) => ({
  queryKey: queryKeys.program.active,
  queryFn: () => getActiveProgram(userId),
  enabled: !!userId,
});
