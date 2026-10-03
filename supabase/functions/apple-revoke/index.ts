// 회원 탈퇴 직전에 호출한다. 저장된 애플 refresh token 을 애플에서 무효화하고 삭제한다.
// 애플 로그인 사용자가 아니면 저장된 토큰이 없으므로 아무것도 하지 않는다.
import {adminClient, getCallerId, json, revokeRefreshToken} from '../_shared/apple.ts';

Deno.serve(async req => {
  if (req.method !== 'POST') {
    return json({error: 'POST 만 허용됩니다.'}, 405);
  }

  try {
    const userId = await getCallerId(req);
    if (!userId) {
      return json({error: '인증되지 않은 요청입니다.'}, 401);
    }

    const admin = adminClient();
    const {data, error} = await admin
      .from('apple_tokens')
      .select('refresh_token')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) {
      throw error;
    }

    if (!data?.refresh_token) {
      return json({success: true, revoked: false});
    }

    await revokeRefreshToken(data.refresh_token);
    await admin.from('apple_tokens').delete().eq('user_id', userId);

    return json({success: true, revoked: true});
  } catch (error) {
    console.error('apple-revoke 실패:', error);
    return json({success: false, error: String(error)}, 500);
  }
});
