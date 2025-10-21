import {useMutation, useQueryClient} from '@tanstack/react-query';
import {deleteUserAccount, checkWithdrawalEligibility} from '../../remote/auth';
import {useAuth} from '../../hooks/useAuth';
import {useNavigation} from '@react-navigation/native';

/**
 * 회원 탈퇴 mutation 훅
 */
export const useDeleteAccountMutation = () => {
  const queryClient = useQueryClient();
  const {signOut} = useAuth();
  const navigation = useNavigation();

  return useMutation({
    mutationFn: deleteUserAccount,
    onSuccess: async () => {
      // 성공 시 모든 쿼리 캐시 무효화
      await queryClient.invalidateQueries();

      // 로그아웃 처리
      await signOut();

      // AuthScreen으로 리다이렉트
      navigation.reset({
        index: 0,
        routes: [{name: 'Auth' as never}],
      });
    },
    onError: error => {
      console.error('회원 탈퇴 실패:', error);
    },
  });
};

/**
 * 탈퇴 가능 여부 확인 쿼리 훅
 */
export const useWithdrawalEligibilityQuery = () => {
  return useMutation({
    mutationFn: checkWithdrawalEligibility,
    onError: error => {
      console.error('탈퇴 가능 여부 확인 실패:', error);
    },
  });
};
