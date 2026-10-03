import {supabase} from '../lib/supabase';

const EDGE_FUNCTIONS_BASE =
  'https://lyzmpbgastvarksnqgjo.supabase.co/functions/v1';

export const edgeFunctionUrl = (name: string) => `${EDGE_FUNCTIONS_BASE}/${name}`;

/**
 * 로그인한 사용자 자격으로 Edge Function 을 호출한다.
 * 세션이 없으면 호출하지 않고 null 을 돌려준다.
 */
export const callEdgeFunction = async (
  name: string,
  body: Record<string, unknown> = {},
): Promise<{ok: boolean; data: any} | null> => {
  const {
    data: {session},
  } = await supabase.auth.getSession();
  const accessToken = session?.access_token;
  if (!accessToken) {
    return null;
  }

  const response = await fetch(edgeFunctionUrl(name), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      apikey: process.env.SUPABASE_ANON_KEY || '',
    },
    body: JSON.stringify(body),
  });

  const data = await response.json().catch(() => null);
  return {ok: response.ok, data};
};
