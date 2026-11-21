import {supabase} from '../lib/supabase';

/**
 * 마지막으로 본 로그인 계정. 운동을 폰에 보관할 때만 쓴다.
 *
 * 앱을 오래 뒤에 두면 access token 이 만료되고, 그 상태로 오프라인이면 getSession 이 갱신에 실패해
 * 세션을 null 로 돌려준다. 그때도 운동은 원래 계정 몫으로 보관해야 하므로 마지막 계정을 기억해 둔다.
 * 직접 로그아웃(SIGNED_OUT)하면 지운다 — 로그아웃한 사람의 운동을 보관하지 않도록.
 * 재전송은 이 값을 쓰지 않고 지금 세션의 계정이 보관분의 주인과 같을 때만 보낸다.
 */
let lastKnownUserId: string | null = null;
let tracking = false;

// 처음 세션을 본 순간부터 로그인 상태 변화를 따라간다.
// 모듈을 불러올 때 구독하지 않는 건, 쓰지도 않는 화면·테스트에서 auth 구독이 생기지 않게 하려는 것
const startTracking = () => {
  if (tracking) {
    return;
  }
  tracking = true;
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_OUT') {
      lastKnownUserId = null;
    } else if (session) {
      lastKnownUserId = session.user.id;
    }
  });
};

/** 세션에서 계정을 봤을 때 부른다. */
export const rememberUserId = (userId: string): void => {
  startTracking();
  lastKnownUserId = userId;
};

export const getLastKnownUserId = (): string | null => lastKnownUserId;
