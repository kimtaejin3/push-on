import {supabase} from '../lib/supabase';

/**
 * 회원 탈퇴 API
 * 사용자의 모든 데이터를 삭제하고 계정을 비활성화합니다.
 */
export const deleteUserAccount = async (): Promise<void> => {
  try {
    // 1. 사용자 인증 확인
    const {
      data: {user},
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error('인증되지 않은 사용자입니다.');
    }

    const userId = user.id;

    // 2. Edge Function을 사용하여 완전한 계정 삭제
    const {
      data: {session},
    } = await supabase.auth.getSession();
    const accessToken = session?.access_token;

    if (!accessToken) {
      throw new Error('인증 토큰이 없습니다.');
    }

    // Edge Function 직접 호출
    console.log('Edge Function 호출 시작:', {
      url: 'https://lyzmpbgastvarksnqgjo.supabase.co/functions/v1/hyper-function',
      userId,
      hasAccessToken: !!accessToken,
    });

    const response = await fetch(
      'https://lyzmpbgastvarksnqgjo.supabase.co/functions/v1/hyper-function',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
          apikey: process.env.SUPABASE_ANON_KEY || '',
        },
        body: JSON.stringify({userId}),
      },
    );

    console.log('Edge Function 응답:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
    });

    const functionData = await response.json();
    console.log('Edge Function 데이터:', functionData);

    if (!response.ok) {
      throw new Error(
        `계정 삭제 실패: ${
          functionData.error ||
          `HTTP ${response.status}: ${response.statusText}`
        }`,
      );
    }

    if (!functionData?.success) {
      throw new Error(
        `계정 삭제 실패: ${functionData?.error || 'Unknown error'}`,
      );
    }

    console.log('계정이 완전히 삭제되었습니다.');

    console.log('회원 탈퇴가 성공적으로 완료되었습니다.');
  } catch (error) {
    console.error('회원 탈퇴 오류:', error);
    throw error;
  }
};

/**
 * 회원 탈퇴 가능 여부 확인
 * 사용자가 탈퇴할 수 있는 상태인지 확인합니다.
 */
export const checkWithdrawalEligibility = async (): Promise<{
  canWithdraw: boolean;
  reason?: string;
}> => {
  try {
    const {
      data: {user},
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        canWithdraw: false,
        reason: '인증되지 않은 사용자입니다.',
      };
    }

    // 추가적인 탈퇴 제한 조건이 있다면 여기에 추가
    // 예: 활성 구독, 미완료 주문 등

    return {
      canWithdraw: true,
    };
  } catch (error) {
    console.error('탈퇴 가능 여부 확인 오류:', error);
    return {
      canWithdraw: false,
      reason: '서버 오류가 발생했습니다.',
    };
  }
};
