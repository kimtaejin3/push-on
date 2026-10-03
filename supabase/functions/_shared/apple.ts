// 애플 REST API 호출에 필요한 공통 로직.
// 회원 탈퇴 시 애플 토큰을 revoke 하라는 App Store 가이드라인 5.1.1(v) 때문에 필요하다.
import * as jose from 'https://esm.sh/jose@5.9.6';
import {createClient} from 'https://esm.sh/@supabase/supabase-js@2';

const APPLE_AUTH_BASE = 'https://appleid.apple.com/auth';

const env = (name: string): string => {
  const value = Deno.env.get(name);
  if (!value) {
    throw new Error(`환경변수 ${name} 가 설정되지 않았습니다.`);
  }
  return value;
};

/**
 * 애플 API 인증용 client secret (ES256 서명 JWT, 최대 6개월 유효하지만 1시간으로 둔다).
 * APPLE_PRIVATE_KEY 는 .p8 파일 내용 전체(-----BEGIN PRIVATE KEY----- 포함).
 */
export const createAppleClientSecret = async (): Promise<string> => {
  const privateKey = await jose.importPKCS8(
    env('APPLE_PRIVATE_KEY').replace(/\\n/g, '\n'),
    'ES256',
  );
  return await new jose.SignJWT({})
    .setProtectedHeader({alg: 'ES256', kid: env('APPLE_KEY_ID')})
    .setIssuer(env('APPLE_TEAM_ID'))
    .setIssuedAt()
    .setExpirationTime('1h')
    .setAudience('https://appleid.apple.com')
    .setSubject(env('APPLE_CLIENT_ID'))
    .sign(privateKey);
};

/** authorizationCode 를 refresh token 으로 교환한다. */
export const exchangeAuthorizationCode = async (
  code: string,
): Promise<string> => {
  const body = new URLSearchParams({
    client_id: env('APPLE_CLIENT_ID'),
    client_secret: await createAppleClientSecret(),
    code,
    grant_type: 'authorization_code',
  });

  const response = await fetch(`${APPLE_AUTH_BASE}/token`, {
    method: 'POST',
    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
    body,
  });
  const data = await response.json();
  if (!response.ok || !data.refresh_token) {
    throw new Error(`애플 토큰 교환 실패: ${JSON.stringify(data)}`);
  }
  return data.refresh_token as string;
};

/** refresh token 을 애플에서 무효화한다. */
export const revokeRefreshToken = async (refreshToken: string): Promise<void> => {
  const body = new URLSearchParams({
    client_id: env('APPLE_CLIENT_ID'),
    client_secret: await createAppleClientSecret(),
    token: refreshToken,
    token_type_hint: 'refresh_token',
  });

  const response = await fetch(`${APPLE_AUTH_BASE}/revoke`, {
    method: 'POST',
    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
    body,
  });
  if (!response.ok) {
    throw new Error(`애플 토큰 revoke 실패: HTTP ${response.status}`);
  }
};

/** service_role 권한의 Supabase 클라이언트 (RLS 우회) */
export const adminClient = () =>
  createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'));

/** Authorization 헤더의 사용자 JWT 로 호출자를 식별한다. */
export const getCallerId = async (req: Request): Promise<string | null> => {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }
  const {data, error} = await adminClient().auth.getUser(
    authHeader.replace('Bearer ', ''),
  );
  if (error || !data.user) {
    return null;
  }
  return data.user.id;
};

export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {'Content-Type': 'application/json'},
  });
