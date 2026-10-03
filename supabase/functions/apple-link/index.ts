// 애플 로그인 직후 authorizationCode 를 refresh token 으로 교환해 저장한다.
// 저장된 토큰은 회원 탈퇴 시 apple-revoke 에서 사용한다.
import {
  adminClient,
  exchangeAuthorizationCode,
  getCallerId,
  json,
} from '../_shared/apple.ts';

Deno.serve(async req => {
  if (req.method !== 'POST') {
    return json({error: 'POST 만 허용됩니다.'}, 405);
  }

  try {
    const userId = await getCallerId(req);
    if (!userId) {
      return json({error: '인증되지 않은 요청입니다.'}, 401);
    }

    const {authorizationCode} = await req.json();
    if (!authorizationCode) {
      return json({error: 'authorizationCode 가 없습니다.'}, 400);
    }

    const refreshToken = await exchangeAuthorizationCode(authorizationCode);

    const {error} = await adminClient()
      .from('apple_tokens')
      .upsert(
        {user_id: userId, refresh_token: refreshToken, updated_at: new Date().toISOString()},
        {onConflict: 'user_id'},
      );
    if (error) {
      throw error;
    }

    return json({success: true});
  } catch (error) {
    console.error('apple-link 실패:', error);
    return json({success: false, error: String(error)}, 500);
  }
});
