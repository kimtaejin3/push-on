import {supabase} from '../lib/supabase';

export class AuthService {
  // 이메일로 회원가입
  static async signUp(email: string, password: string) {
    try {
      const {data, error} = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        throw error;
      }
      return {data, error: null};
    } catch (error) {
      return {data: null, error};
    }
  }

  // 이메일로 로그인
  static async signIn(email: string, password: string) {
    try {
      const {data, error} = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }
      return {data, error: null};
    } catch (error) {
      return {data: null, error};
    }
  }

  // 카카오 로그인 (OAuth)
  static async signInWithKakao() {
    try {
      // authService.ts에서 PKCE 플로우로 수정
      const {data, error} = await supabase.auth.signInWithOAuth({
        provider: 'kakao',
        options: {
          redirectTo: 'pushupapp://login-callback',
        },
      });

      if (error) {
        throw error;
      }
      return {data, error: null};
    } catch (error) {
      return {data: null, error};
    }
  }

  // 로그아웃
  static async signOut() {
    try {
      const {error} = await supabase.auth.signOut();
      if (error) {
        throw error;
      }
      return {error: null};
    } catch (error) {
      return {error};
    }
  }

  // 현재 사용자 정보 가져오기
  static async getCurrentUser() {
    try {
      const {
        data: {user},
        error,
      } = await supabase.auth.getUser();
      if (error) {
        throw error;
      }
      return {user, error: null};
    } catch (error) {
      return {user: null, error};
    }
  }

  // 인증 상태 변경 감지
  static onAuthStateChange(callback: (user: any) => void) {
    return supabase.auth.onAuthStateChange((event, session) => {
      callback(session?.user ?? null);
    });
  }

  // 세션 확인
  static async getSession() {
    try {
      const {
        data: {session},
        error,
      } = await supabase.auth.getSession();
      if (error) {
        throw error;
      }
      return {session, error: null};
    } catch (error) {
      return {session: null, error};
    }
  }
}
