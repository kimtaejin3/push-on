import {getProfile} from '../remote/profile';

const profileQueryOptions = (userId: string) => {
  return {
    queryKey: ['profile'],
    queryFn: () => getProfile(userId),
  };
};

export {profileQueryOptions};
