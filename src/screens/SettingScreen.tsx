import React from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Alert,
  Linking,
} from 'react-native';
import Fontawesome5 from '@react-native-vector-icons/fontawesome5';
import {colors} from '../constants/colors';
import {useAuth} from '../hooks/useAuth';

interface SettingScreenProps {
  navigation: any;
}

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
        color={isDestructive ? colors.error : colors.textLight}
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
        color={colors.gray400}
      />
    )}
  </TouchableOpacity>
);

function SettingScreen({navigation}: SettingScreenProps) {
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
    navigation.navigate('PrivacyPolicy');
  };

  const handleTermsOfService = () => {
    navigation.navigate('TermsOfService');
  };

  const handleAppInfo = () => {
    navigation.navigate('AppInfo');
  };

  const handleContactUs = () => {
    Alert.alert(
      '문의하기',
      '버그 신고나 기능 제안이 있으시면 아래 이메일로 문의해주세요.\n\nrlaxowls1316@naver.com',
      [
        {text: '닫기', style: 'cancel'},
        {
          text: '이메일 보내기',
          onPress: () => {
            Linking.openURL(
              'mailto:rlaxowls1316@naver.com?subject=PushOn 문의',
            );
          },
        },
      ],
    );
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

        {/* 정보 섹션 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>정보</Text>
          <View style={styles.sectionContent}>
            <SettingItem
              icon="info-circle"
              title="앱 정보"
              onPress={handleAppInfo}
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
          <Text style={styles.versionText}>PushOn v1.0.0</Text>
          <Text style={styles.copyrightText}>
            © 2025 PushOn. All rights reserved.
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
    backgroundColor: colors.backgroundDark,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.primary,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textLight,
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
    backgroundColor: colors.overlayLight,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingItemText: {
    fontSize: 16,
    color: colors.textLight,
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
