import {useMutation, useQueryClient} from '@tanstack/react-query';
import {deleteUserAccount, checkWithdrawalEligibility} from '../../remote/auth';
import {useSession} from '../../hooks/useSession';
import {useNavigation} from '@react-navigation/native';
import { useAuth } from '../../hooks/useAuth';
import { providers } from '../../types/auth';

/**
 * 회원 탈퇴 mutation 훅
 */
export const useDeleteAccountMutation = () => {
  const queryClient = useQueryClient();
  const {signOut: signOutProvider} = useAuth();
  const navigation = useNavigation();
  const {user} = useSession();

  return useMutation({
    mutationFn: deleteUserAccount,
    onSuccess: async () => {
      await queryClient.invalidateQueries();

      if (!user) {throw new Error('사용자 정보를 찾을 수 없습니다.');}
      if (!user.app_metadata.provider) {throw new Error('사용자 제공자 정보를 찾을 수 없습니다.');}

      await signOutProvider(user.app_metadata.provider as typeof providers[number]);

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
