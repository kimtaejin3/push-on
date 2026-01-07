import React, {useState} from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import Fontawesome5 from '@react-native-vector-icons/fontawesome5';
import {colors} from '../constants/colors';
import {useSession} from '../hooks/useSession';
import Header from '../components/common/Header';
import {useDeleteAccountMutation} from '../tanstack-query/mutationHooks/auth';
import { useAuth } from '../hooks/useAuth';
import { providers } from '../types/auth';

function AccountSettingsScreen() {
  const navigation = useNavigation();
  const {user} = useSession();
  const {signOut: signOutProvider} = useAuth();
  const [imageError, setImageError] = useState(false);
  const deleteAccountMutation = useDeleteAccountMutation();

  // 사용자 정보 추출
  const userName =
    user?.user_metadata?.name || user?.user_metadata?.full_name || '사용자';
  const userEmail = user?.email || '';

  // 카카오 이미지 URL 처리
  const rawProfileImage = user?.user_metadata?.avatar_url || '';
  let profileImage = '';

  if (rawProfileImage) {
    if (rawProfileImage.includes('fname=')) {
      try {
        const fnamePart = rawProfileImage.split('fname=')[1];
        profileImage = decodeURIComponent(fnamePart);
      } catch (error) {
        profileImage = rawProfileImage;
      }
    } else {
      profileImage = rawProfileImage;
    }

    // HTTP를 HTTPS로 변경 (보안 정책 대응)
    if (profileImage.startsWith('http://')) {
      profileImage = profileImage.replace('http://', 'https://');
    }
  }
  const provider = user?.app_metadata?.provider || 'unknown';
  const joinedDate = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('ko-KR')
    : '';

  const getProviderInfo = (providerType: string) => {
    switch (providerType) {
      case 'kakao':
        return {
          name: '카카오',
          icon: 'comment',
          color: '#FEE500',
        };
      case 'google':
        return {
          name: '구글',
          icon: 'search',
          color: colors.primary,
        };
      default:
        return {
          name: '이메일',
          icon: 'envelope',
          color: colors.primary,
        };
    }
  };

  const providerInfo = getProviderInfo(provider);

  const handleLogout = async () => {
    Alert.alert('로그아웃', '정말 로그아웃하시겠습니까?', [
      {
        text: '취소',
        style: 'cancel',
      },
      {
        text: '로그아웃',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOutProvider(user?.app_metadata?.provider as typeof providers[number]);
          } catch (error) {
            console.error('로그아웃 오류:', error);
            Alert.alert('오류', '로그아웃 중 오류가 발생했습니다.');
          }
        },
      },
    ]);
  };

  const handleWithdrawal = () => {
    Alert.alert(
      '회원 탈퇴',
      '정말 회원 탈퇴하시겠습니까?\n\n탈퇴 시 모든 데이터가 영구적으로 삭제되며 복구할 수 없습니다.',
      [
        {text: '취소', style: 'cancel'},
        {
          text: '회원 탈퇴',
          style: 'destructive',
          onPress: () => {
            // 이중 확인
            Alert.alert(
              '최종 확인',
              '정말로 탈퇴하시겠습니까?\n이 작업은 되돌릴 수 없습니다.',
              [
                {text: '취소', style: 'cancel'},
                {
                  text: '탈퇴하기',
                  style: 'destructive',
                  onPress: () => {
                    deleteAccountMutation.mutate();
                    navigation.reset({
                      index: 0,
                      routes: [{name: 'Auth' as never}],
                    });
                  },
                },
              ],
            );
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <Header title="계정 설정" onBackPress={() => navigation.goBack()} />

      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          {/* 프로필 섹션 */}
          <View style={styles.profileSection}>
            <View style={styles.profileImageContainer}>
              {profileImage && !imageError ? (
                <Image
                  source={{uri: profileImage}}
                  style={styles.profileImage}
                  onError={() => {
                    setImageError(true);
                  }}
                  onLoad={() => {
                    setImageError(false);
                  }}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.defaultProfileImage}>
                  <Fontawesome5
                    name="user"
                    size={40}
                    iconStyle="solid"
                    color={colors.textSecondary}
                  />
                </View>
              )}
            </View>
            <Text style={styles.userName}>{userName}</Text>
            <Text style={styles.userEmail}>{userEmail}</Text>
          </View>

          {/* 계정 정보 섹션 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>계정 정보</Text>
            <View style={styles.infoContainer}>
              <View style={styles.infoItem}>
                <View style={styles.infoItemLeft}>
                  <Fontawesome5
                    name="user"
                    size={16}
                    iconStyle="solid"
                    color={colors.primary}
                  />
                  <Text style={styles.infoLabel}>이름</Text>
                </View>
                <Text style={styles.infoValue}>{userName}</Text>
              </View>

              <View style={styles.infoItem}>
                <View style={styles.infoItemLeft}>
                  <Fontawesome5
                    name={providerInfo.icon as any}
                    size={16}
                    iconStyle="solid"
                    color={providerInfo.color}
                  />
                  <Text style={styles.infoLabel}>가입 방법</Text>
                </View>
                <Text style={styles.infoValue}>{providerInfo.name}</Text>
              </View>

              <View style={[styles.infoItem, styles.noBorder]}>
                <View style={styles.infoItemLeft}>
                  <Fontawesome5
                    name="calendar-plus"
                    size={16}
                    iconStyle="solid"
                    color={colors.primary}
                  />
                  <Text style={styles.infoLabel}>가입일</Text>
                </View>
                <Text style={styles.infoValue}>{joinedDate}</Text>
              </View>
            </View>
          </View>

          {/* 계정 상태 섹션 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>계정 상태</Text>
            <View style={styles.statusContainer}>
              <View style={styles.statusItem}>
                <View
                  style={[
                    styles.statusIndicator,
                    {backgroundColor: colors.success},
                  ]}
                />
                <Text style={styles.statusText}>계정 활성화</Text>
              </View>
            </View>
          </View>

          {/* 계정 관리 섹션 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>계정 관리</Text>
            <View style={styles.actionSection}>
              <TouchableOpacity
                style={styles.logoutButton}
                onPress={handleLogout}>
                <Fontawesome5
                  name="sign-out-alt"
                  size={20}
                  iconStyle="solid"
                  color={colors.textLight}
                />
                <Text style={styles.logoutButtonText}>로그아웃</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.logoutButton,
                  deleteAccountMutation.isPending && styles.disabledButton,
                ]}
                onPress={handleWithdrawal}
                disabled={deleteAccountMutation.isPending}>
                <Fontawesome5
                  name="trash-alt"
                  size={20}
                  iconStyle="solid"
                  color={colors.textLight}
                />
                <Text style={styles.logoutButtonText}>
                  {deleteAccountMutation.isPending
                    ? '탈퇴 처리 중...'
                    : '회원 탈퇴'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundDark,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 30,
    paddingVertical: 20,
  },
  profileImageContainer: {
    marginBottom: 16,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  defaultProfileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.overlayLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textLight,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textLight,
    marginBottom: 12,
  },
  infoContainer: {
    backgroundColor: colors.overlayLight,
    borderRadius: 12,
    padding: 16,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.overlayMedium,
  },
  infoItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 8,
  },
  infoValue: {
    fontSize: 14,
    color: colors.textLight,
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  statusContainer: {
    backgroundColor: colors.overlayLight,
    borderRadius: 12,
    padding: 16,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginRight: 12,
  },
  statusText: {
    fontSize: 14,
    color: colors.textLight,
  },
  actionSection: {
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.overlayLight,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  actionButtonText: {
    fontSize: 16,
    color: colors.textLight,
    marginLeft: 8,
    fontWeight: '500',
  },
  noBorder: {
    borderBottomWidth: 0,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.overlayLight,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  logoutButtonText: {
    fontSize: 16,
    marginLeft: 8,
    fontWeight: '500',
    color: colors.textLight,
  },
  disabledButton: {
    opacity: 0.5,
  },
});

export default AccountSettingsScreen;
