import {callEdgeFunction} from './edgeFunctions';

/**
 * 애플 로그인 직후 받은 authorizationCode 를 서버로 보내 refresh token 으로 교환·저장한다.
 * 회원 탈퇴 시 애플 토큰을 revoke 하려면 이 토큰이 필요하다 (App Store 가이드라인 5.1.1(v)).
 *
 * 실패해도 로그인 자체는 성공시킨다 — 다음 로그인 때 다시 시도된다.
 */
export const linkAppleToken = async (authorizationCode: string): Promise<void> => {
  try {
    const result = await callEdgeFunction('apple-link', {authorizationCode});
    if (result && !result.ok) {
      console.warn('애플 토큰 연결 실패:', result.data);
    }
  } catch (error) {
    console.warn('애플 토큰 연결 중 오류:', error);
  }
};

/**
 * 저장해 둔 애플 refresh token 을 애플 서버에서 revoke 한다.
 * 회원 탈퇴 직전에 호출한다. 애플 로그인 사용자가 아니면 서버에서 no-op.
 */
export const revokeAppleToken = async (): Promise<void> => {
  const result = await callEdgeFunction('apple-revoke');
  if (result && !result.ok) {
    console.warn('애플 토큰 revoke 실패:', result.data);
  }
};
