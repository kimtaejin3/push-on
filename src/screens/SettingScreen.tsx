import React from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import Fontawesome5 from '@react-native-vector-icons/fontawesome5';
import {colors} from '../constants/colors';
import {useAuth} from '../hooks/useAuth';

interface SettingItemProps {
  icon: string;
  title: string;
  onPress: () => void;
  showArrow?: boolean;
  isDestructive?: boolean;
}

const SettingItem: React.FC<SettingItemProps> = ({
  icon,
  title,
  onPress,
  showArrow = true,
  isDestructive = false,
}) => (
  <TouchableOpacity style={styles.settingItem} onPress={onPress}>
    <View style={styles.settingItemLeft}>
      <Fontawesome5
        name={icon as any}
        size={20}
        iconStyle="solid"
        color={isDestructive ? colors.error : colors.textPrimary}
      />
      <Text
        style={[
          styles.settingItemText,
          isDestructive && styles.destructiveText,
        ]}>
        {title}
      </Text>
    </View>
    {showArrow && (
      <Fontawesome5
        name="chevron-right"
        size={16}
        iconStyle="solid"
        color={colors.gray300}
      />
    )}
  </TouchableOpacity>
);

function SettingScreen() {
  const {signOut} = useAuth();

  const handleLogout = () => {
    Alert.alert('로그아웃', '정말 로그아웃하시겠습니까?', [
      {text: '취소', style: 'cancel'},
      {
        text: '로그아웃',
        style: 'destructive',
        onPress: () => {
          signOut();
        },
      },
    ]);
  };

  const handlePrivacyPolicy = () => {
    // TODO: 개인정보처리방침 링크
    Alert.alert('개인정보처리방침', '개인정보처리방침 페이지로 이동합니다.');
  };

  const handleTermsOfService = () => {
    // TODO: 이용약관 링크
    Alert.alert('이용약관', '이용약관 페이지로 이동합니다.');
  };

  const handleContactUs = () => {
    // TODO: 문의하기
    Alert.alert('문의하기', '고객센터로 문의하시겠습니까?');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* 헤더 */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>설정</Text>
        </View>

        {/* 계정 섹션 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>계정</Text>
          <View style={styles.sectionContent}>
            <SettingItem
              icon="user"
              title="프로필 수정"
              onPress={() =>
                Alert.alert('프로필 수정', '프로필 수정 기능입니다.')
              }
            />
            <SettingItem
              icon="cog"
              title="계정 설정"
              onPress={() => Alert.alert('계정 설정', '계정 설정 기능입니다.')}
            />
          </View>
        </View>

        {/* 앱 설정 섹션 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>앱 설정</Text>
          <View style={styles.sectionContent}>
            <SettingItem
              icon="bell"
              title="알림 설정"
              onPress={() => Alert.alert('알림 설정', '알림 설정 기능입니다.')}
            />
            <SettingItem
              icon="palette"
              title="테마 설정"
              onPress={() => Alert.alert('테마 설정', '테마 설정 기능입니다.')}
            />
            <SettingItem
              icon="language"
              title="언어 설정"
              onPress={() => Alert.alert('언어 설정', '언어 설정 기능입니다.')}
            />
          </View>
        </View>

        {/* 정보 섹션 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>정보</Text>
          <View style={styles.sectionContent}>
            <SettingItem
              icon="info-circle"
              title="앱 정보"
              onPress={() => Alert.alert('앱 정보', '푸쉬핏 v1.0.0')}
            />
            <SettingItem
              icon="file-contract"
              title="이용약관"
              onPress={handleTermsOfService}
            />
            <SettingItem
              icon="shield-alt"
              title="개인정보처리방침"
              onPress={handlePrivacyPolicy}
            />
            <SettingItem
              icon="question-circle"
              title="문의하기"
              onPress={handleContactUs}
            />
          </View>
        </View>

        {/* 로그아웃 섹션 */}
        <View style={styles.section}>
          <View style={styles.sectionContent}>
            <SettingItem
              icon="sign-out-alt"
              title="로그아웃"
              onPress={handleLogout}
              showArrow={false}
              isDestructive={true}
            />
          </View>
        </View>

        {/* 앱 버전 정보 */}
        <View style={styles.footer}>
          <Text style={styles.versionText}>푸쉬핏 v1.0.0</Text>
          <Text style={styles.copyrightText}>
            © 2024 푸쉬핏. All rights reserved.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default SettingScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  sectionContent: {
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.gray200,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingItemText: {
    fontSize: 16,
    color: colors.textPrimary,
    marginLeft: 12,
  },
  destructiveText: {
    color: colors.error,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  versionText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  copyrightText: {
    fontSize: 12,
    color: colors.gray400,
  },
});
