import {SUPABASE_ANON_KEY, SUPABASE_URL} from '@env';
import {supabase} from '../lib/supabase';
import type {Provider} from '../types/auth';

/**
 * 게스트(익명) 계정.
 * 처음 켠 사람은 로그인 없이 익명 계정을 자동으로 받아 바로 앱을 쓴다 (App Store 5.1.1(v)).
 * 기록은 이 계정 ID 로 서버에 저장되고, 나중에 Apple·카카오·Google 을 이 계정에 연결하면
 * 같은 ID 그대로 영구 계정이 된다 (기록을 옮길 필요가 없다).
 */

/** 지금 세션이 익명(게스트) 계정인지 */
export const isGuestUser = (user: {is_anonymous?: boolean} | null | undefined): boolean =>
  user?.is_anonymous === true;

/** 익명 계정을 새로 만든다. 실패하면 던진다 (오프라인 등) */
export const signInAsGuest = async (): Promise<void> => {
  const {error} = await supabase.auth.signInAnonymously();
  if (error) {
    throw error;
  }
};

export type LinkResult = {status: 'linked'} | {status: 'exists'} | {status: 'failed'; error: unknown};

/**
 * 지금 익명 계정에 소셜 계정(ID 토큰)을 연결한다.
 * 설치된 supabase-js(2.58)에는 ID 토큰 연결 API 가 없어, 최신 auth-js 의 linkIdentityIdToken 과 같은
 * 요청(grant_type=id_token + link_identity)을 직접 보내고 받은 세션을 저장한다.
 * 그 소셜 계정이 이미 다른 계정에 쓰이고 있으면 'exists' — 호출한 쪽이 그 계정으로 로그인할지 묻는다.
 */
export const linkIdTokenToGuest = async ({
  provider,
  token,
  nonce,
}: {
  provider: Provider;
  token: string;
  nonce?: string;
}): Promise<LinkResult> => {
  try {
    const {
      data: {session},
    } = await supabase.auth.getSession();
    if (!session) {
      return {status: 'failed', error: new Error('세션이 없어요')};
    }
    const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=id_token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({provider, id_token: token, nonce, link_identity: true}),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      const code = body?.error_code ?? body?.code;
      if (code === 'identity_already_exists' || code === 'email_exists') {
        return {status: 'exists'};
      }
      return {status: 'failed', error: body};
    }
    const {error} = await supabase.auth.setSession({
      access_token: body.access_token,
      refresh_token: body.refresh_token,
    });
    if (error) {
      return {status: 'failed', error};
    }
    // 연결 뒤 사용자 정보(is_anonymous=false, provider)를 새로 받는다
    await supabase.auth.refreshSession();
    return {status: 'linked'};
  } catch (error) {
    return {status: 'failed', error};
  }
};
