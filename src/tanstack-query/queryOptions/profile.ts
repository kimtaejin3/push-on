import {getProfile} from '../../remote/profile';
import {queryKeys} from '../queryKeys';

const profileQueryOptions = (userId: string) => {
  return {
    queryKey: queryKeys.profile.me,
    queryFn: () => getProfile(userId),
  };
};

export {profileQueryOptions};
