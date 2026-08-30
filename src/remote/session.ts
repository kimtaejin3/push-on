import {isAuthApiError} from '@supabase/supabase-js';
import {supabase} from '../lib/supabase';

/**
 * 서버가 "이 JWT 의 유저는 없다"고 답하는 상태 코드.
 * (auth-js 의 signOut 이 무시하는 코드 목록과 동일)
 */
const USER_GONE_STATUSES = [401, 403, 404];

/**
 * 저장된 세션의 유저가 서버(auth.users)에서 삭제됐는지 확인하고,
 * 삭제됐으면 로컬 세션을 지운다.
 *
 * 회원 탈퇴 후 provider 로그아웃 실패 등으로 세션이 기기에 남으면,
 * JWT 가 만료되기 전까지 PostgREST 는 요청을 통과시키므로
 * 온보딩 → profiles upsert → FK 위반이 반복된다. 이를 앱 시작 시 끊는다.
 *
 * @returns 세션을 지웠으면 true. 네트워크 오류 등 판단 불가면 false (세션 유지).
 */
export const signOutIfUserDeleted = async (): Promise<boolean> => {
  const {error} = await supabase.auth.getUser();
  if (!error) {
    return false;
  }
  if (!(isAuthApiError(error) && USER_GONE_STATUSES.includes(error.status))) {
    return false;
  }

  console.warn('서버에 존재하지 않는 유저의 세션을 제거합니다:', error.message);
  const {error: signOutError} = await supabase.auth.signOut({scope: 'local'});
  if (signOutError) {
    console.error('로컬 세션 제거 실패:', signOutError);
  }
  return true;
};
