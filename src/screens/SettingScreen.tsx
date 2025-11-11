import React from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  ScrollView,
  Alert,
  Linking,
} from 'react-native';
import {colors} from '../constants/colors';
import SettingItem from '../components/common/SettingItem';

interface SettingScreenProps {
  navigation: any;
}

function SettingScreen({navigation}: SettingScreenProps) {
  const handlePrivacyPolicy = () => {
    navigation.navigate('PrivacyPolicy');
  };

  const handleTermsOfService = () => {
    navigation.navigate('TermsOfService');
  };

  const handleAccountSettings = () => {
    navigation.navigate('AccountSettings');
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
              onPress={() => navigation.navigate('ProfileEdit')}
            />
            <SettingItem
              icon="user-cog"
              title="계정 설정"
              onPress={handleAccountSettings}
            />
          </View>
        </View>

        {/* 정보 섹션 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>정보</Text>
          <View style={styles.sectionContent}>
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

        {/* 앱 버전 정보 */}
        <View style={styles.footer}>
          <Text style={styles.versionText}>PushOn v1.1.1</Text>
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
