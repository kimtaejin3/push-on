import React, {useState} from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import Fontawesome5 from '@react-native-vector-icons/fontawesome5';
import {colors} from '../constants/colors';
import {useAuth} from '../hooks/useAuth';
import Header from '../components/common/Header';

function AccountSettingsScreen() {
  const navigation = useNavigation();
  const {user} = useAuth();
  const [imageError, setImageError] = useState(false);

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
        console.log('URL 디코딩 실패:', error);
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
          icon: 'google',
          color: '#4285F4',
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

  // 디버깅용 로그
  console.log('Raw Profile Image URL:', rawProfileImage);
  console.log('Processed Profile Image URL:', profileImage);
  console.log('User metadata:', user?.user_metadata);

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
                    console.log('이미지 로딩 실패:', profileImage);
                    setImageError(true);
                  }}
                  onLoad={() => {
                    console.log('이미지 로딩 성공');
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
});

export default AccountSettingsScreen;
