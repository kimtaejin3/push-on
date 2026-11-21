import {getAdConfig} from '../../remote/appConfig';
import {queryKeys} from '../queryKeys';

// 서버에서 광고를 끄면 길어도 5분 안에 반영되게 한다
export const adConfigQueryOptions = () => ({
  queryKey: queryKeys.appConfig.ads,
  queryFn: getAdConfig,
  staleTime: 5 * 60 * 1000,
});
