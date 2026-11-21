import React, {useRef, useState} from 'react';
import {Pressable, ScrollView, StyleSheet, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useQuery} from '@tanstack/react-query';
import type {User} from '@supabase/supabase-js';
import {LogOut} from 'lucide-react-native';
import {AccountAvatar} from '../components/features/account/AccountAvatar';
import {Row} from '../components/ui/Row';
import {ScreenHeader} from '../components/ui/ScreenHeader';
import {Text} from '../components/ui/Text';
import {ConfirmDialog} from '../components/ui/feedback/ConfirmDialog';
import {ErrorState} from '../components/ui/feedback/ErrorState';
import {Skeleton} from '../components/ui/feedback/Skeleton';
import {useToast} from '../components/ui/feedback/ToastProvider';
import {useAuth} from '../hooks/useAuth';
import {useSession} from '../hooks/useSession';
import type {AppStackParamList} from '../navigations/AppNavigation';
import {
  useDeleteAccountMutation,
  useWithdrawalEligibilityQuery,
} from '../tanstack-query/mutationHooks/auth';
import {profileQueryOptions} from '../tanstack-query/queryOptions/profile';
import {color, layout, radius, space} from '../theme';
import type {Provider} from '../types/auth';
import {extractUserInfo} from '../utils/user';

const dialogs = {
  logout: {
    title: '로그아웃할까요?',
    message: '운동 기록은 계정에 남아요. 다시 로그인하면 그대로예요.',
    confirmLabel: '로그아웃',
    cancelLabel: '취소',
  },
  delete: {
    title: '계정을 삭제할까요?',
    message: '운동 기록·순위·닉네임이 모두 영구 삭제돼요.',
    confirmLabel: '계속',
    cancelLabel: '취소',
  },
  confirmDelete: {
    title: '정말 삭제할까요?',
    message: '되돌릴 수 없어요. 삭제하면 바로 로그아웃돼요.',
    confirmLabel: '계정 삭제',
    cancelLabel: '취소',
  },
  deleteError: {
    title: '계정을 삭제하지 못했어요',
    message: '연결을 확인하고 다시 시도해 주세요.',
    confirmLabel: '다시 시도',
    cancelLabel: '닫기',
  },
};

type Dialog = keyof typeof dialogs;

function AccountSettingsScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const [sessionAttempt, setSessionAttempt] = useState(0);

  return (
    <SafeAreaView style={styles.screen}>
      <ScreenHeader title="계정 설정" onBack={() => navigation.goBack()} />
      <AccountContent
        key={sessionAttempt}
        onRetry={() => setSessionAttempt(attempt => attempt + 1)}
        onEditProfile={() => navigation.navigate('ProfileEdit')}
      />
    </SafeAreaView>
  );
}

function AccountContent({
  onRetry,
  onEditProfile,
}: {
  onRetry: () => void;
  onEditProfile: () => void;
}) {
  const {user, loading} = useSession();

  if (!user) {
    return (
      <ScrollView contentContainerStyle={styles.content}>
        {loading ? (
          <Skeleton width="fill" height={64} radius={radius.m} />
        ) : (
          <ErrorState
            title="계정 정보를 불러오지 못했어요"
            message="잠시 뒤 다시 시도해 주세요."
            actionLabel="다시 시도"
            onAction={onRetry}
          />
        )}
      </ScrollView>
    );
  }

  return <UserInfo user={user} onEditProfile={onEditProfile} />;
}

function UserInfo({
  user,
  onEditProfile,
}: {
  user: User;
  onEditProfile: () => void;
}) {
  const {userName, userEmail, profileImage, providerInfo, joinedDate} =
    extractUserInfo(user);
  const {data: profile} = useQuery(profileQueryOptions(user.id));
  const name = profile?.nickname || userName;
  const emailParts = /^([^@]+)(@[^@]+)$/.exec(userEmail);
  const email = emailParts
    ? `${emailParts[1].slice(0, Math.min(3, emailParts[1].length - 1))}***${
        emailParts[2]
      }`
    : '';
  const {signOut} = useAuth();
  const toast = useToast();
  const deleteAccount = useDeleteAccountMutation();
  const withdrawalEligibility = useWithdrawalEligibilityQuery();
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const [isWorking, setIsWorking] = useState(false);
  const inFlight = useRef(false);
  const activeDialog = dialog ? dialogs[dialog] : dialogs.delete;

  const handleConfirm = async () => {
    if (!dialog || inFlight.current) {
      return;
    }
    if (dialog === 'delete') {
      setDialog('confirmDelete');
      return;
    }

    const isLogout = dialog === 'logout';
    inFlight.current = true;
    setIsWorking(true);

    try {
      if (isLogout) {
        await signOut(user.app_metadata.provider as Provider);
      } else {
        const eligibility = await withdrawalEligibility.mutateAsync();
        if (!eligibility.canWithdraw) {
          setDialog(null);
          toast.show(eligibility.reason || '계정을 삭제할 수 없어요.', {
            tone: 'alert',
          });
          return;
        }

        // 토큰 revoke와 세션 정리는 기존 탈퇴 mutation이 처리한다.
        await deleteAccount.mutateAsync();
        toast.show('계정을 삭제했어요');
      }
      setDialog(null);
    } catch (error) {
      if (isLogout) {
        console.error('로그아웃 오류:', error);
        setDialog(null);
        toast.show('로그아웃하지 못했어요. 다시 시도해 주세요.', {
          tone: 'alert',
        });
      } else {
        setDialog('deleteError');
      }
    } finally {
      inFlight.current = false;
      setIsWorking(false);
    }
  };

  return (
    <>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.profile}>
          <AccountAvatar name={name} imageUri={profileImage} size={64} />
          <View style={styles.profileCopy}>
            <Text variant="headline" weight={800} style={styles.name}>
              {name}
            </Text>
            {email ? (
              <Text variant="label" weight={500} color="textMuted">
                {email}
              </Text>
            ) : null}
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={onEditProfile}
            style={({pressed}) => [styles.edit, pressed && styles.pressed]}>
            <Text variant="caption" weight={700}>
              프로필 수정
            </Text>
          </Pressable>
        </View>

        <View>
          <Text variant="caption" weight={700} color="textMuted">
            계정 정보
          </Text>
          <Row title="가입 방법" value={providerInfo.name} icon="lock" />
          <Row title="가입일" value={joinedDate} icon="calendar-days" />
        </View>

        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            onPress={() => setDialog('logout')}
            style={({pressed}) => [styles.logout, pressed && styles.pressed]}>
            <LogOut size={20} color={color.text} accessible={false} />
            <Text weight={800}>로그아웃</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => setDialog('delete')}
            style={({pressed}) => [styles.delete, pressed && styles.pressed]}>
            <Text variant="label" color="alert" weight={800}>
              계정 삭제
            </Text>
          </Pressable>
        </View>
      </ScrollView>

      <ConfirmDialog
        {...activeDialog}
        visible={dialog !== null}
        destructive={dialog === 'confirmDelete' || dialog === 'deleteError'}
        confirmLabel={
          isWorking
            ? dialog === 'logout'
              ? '로그아웃 중…'
              : '삭제하는 중…'
            : activeDialog.confirmLabel
        }
        onConfirm={handleConfirm}
        onCancel={() => {
          if (!inFlight.current) {
            setDialog(null);
          }
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: color.bg},
  content: {
    flexGrow: 1,
    gap: space[24],
    paddingHorizontal: layout.screenPadding,
    paddingTop: space[8],
    paddingBottom: space[12],
  },
  profile: {flexDirection: 'row', alignItems: 'center', gap: space[12]},
  profileCopy: {flex: 1, gap: space[4]},
  name: {fontSize: 20, lineHeight: 26},
  edit: {
    minHeight: layout.touchMin,
    paddingHorizontal: space[12],
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: radius.m,
  },
  pressed: {opacity: 0.7},
  actions: {marginTop: 'auto', gap: space[4]},
  logout: {
    minHeight: layout.primaryButtonHeight,
    flexDirection: 'row',
    gap: space[8],
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: color.surface2,
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: radius.m,
  },
  delete: {
    minHeight: layout.touchMin,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default AccountSettingsScreen;
