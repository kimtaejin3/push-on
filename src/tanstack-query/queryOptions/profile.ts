import {findProfile} from '../../remote/profile';
import {queryKeys} from '../queryKeys';

const profileQueryOptions = (userId: string) => {
  return {
    queryKey: queryKeys.profile.me,
    queryFn: () => findProfile(userId),
    retry: 0,
  };
};

export {profileQueryOptions};
