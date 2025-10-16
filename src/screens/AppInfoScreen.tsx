import React from 'react';
import {SafeAreaView, StyleSheet, Text, View, ScrollView} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import Fontawesome5 from '@react-native-vector-icons/fontawesome5';
import {colors} from '../constants/colors';
import Header from '../components/common/Header';

function AppInfoScreen() {
  const navigation = useNavigation();
  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <Header title="앱 정보" onBackPress={() => navigation.goBack()} />

      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          {/* 앱 로고 및 기본 정보 */}
          <View style={styles.appInfoSection}>
            <View style={styles.logoContainer}>
              <Fontawesome5
                name="dumbbell"
                size={40}
                iconStyle="solid"
                color={colors.primary}
              />
            </View>
            <Text style={styles.appName}>PushOn</Text>
            <Text style={styles.appVersion}>버전 1.0.0</Text>
            <Text style={styles.appDescription}>
              얼굴인식 기반 푸쉬업 카운팅 앱
            </Text>
          </View>

          {/* 주요 기능 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>주요 기능</Text>
            <View style={styles.featureList}>
              <View style={styles.featureItem}>
                <Fontawesome5
                  name="eye"
                  size={16}
                  iconStyle="solid"
                  color={colors.primary}
                />
                <Text style={styles.featureText}>
                  얼굴인식 기반 자동 카운팅
                </Text>
              </View>
              <View style={styles.featureItem}>
                <Fontawesome5
                  name="chart-line"
                  size={16}
                  iconStyle="solid"
                  color={colors.primary}
                />
                <Text style={styles.featureText}>운동 기록 및 통계 분석</Text>
              </View>
              <View style={styles.featureItem}>
                <Fontawesome5
                  name="trophy"
                  size={16}
                  iconStyle="solid"
                  color={colors.primary}
                />
                <Text style={styles.featureText}>챌린지 및 목표 설정</Text>
              </View>
              <View style={styles.featureItem}>
                <Fontawesome5
                  name="history"
                  size={16}
                  iconStyle="solid"
                  color={colors.primary}
                />
                <Text style={styles.featureText}>운동 히스토리 관리</Text>
              </View>
            </View>
          </View>

          {/* 개발 정보 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>개발 정보</Text>
            <View style={styles.infoList}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>개발사</Text>
                <Text style={styles.infoValue}>PushOn Team</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>빌드 버전</Text>
                <Text style={styles.infoValue}>1.0.0 (Build 1)</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>최종 업데이트</Text>
                <Text style={styles.infoValue}>2025년 1월 16일</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>플랫폼</Text>
                <Text style={styles.infoValue}>iOS, Android</Text>
              </View>
            </View>
          </View>

          {/* 기술 스택 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>기술 스택</Text>
            <View style={styles.techStack}>
              <Text style={styles.techItem}>React Native</Text>
              <Text style={styles.techItem}>TypeScript</Text>
              <Text style={styles.techItem}>Supabase</Text>
              <Text style={styles.techItem}>React Query</Text>
              <Text style={styles.techItem}>React Navigation</Text>
            </View>
          </View>

          {/* 문의 정보 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>문의 및 지원</Text>
            <View style={styles.contactInfo}>
              <Text style={styles.contactText}>
                버그 신고나 기능 제안이 있으시면 언제든지 문의해주세요.
              </Text>
              <Text style={styles.contactText}>
                설정 → 문의하기를 통해 연락하실 수 있습니다.
              </Text>
            </View>
          </View>

          {/* 저작권 */}
          <View style={styles.footer}>
            <Text style={styles.copyrightText}>
              © 2025 PushOn. All rights reserved.
            </Text>
            <Text style={styles.copyrightText}>
              Made with ❤️ for fitness enthusiasts
            </Text>
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
  appInfoSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.overlayLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.textLight,
    marginBottom: 4,
  },
  appVersion: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  appDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
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
  featureList: {
    backgroundColor: colors.overlayLight,
    borderRadius: 12,
    padding: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureText: {
    fontSize: 14,
    color: colors.textLight,
    marginLeft: 12,
    flex: 1,
  },
  infoList: {
    backgroundColor: colors.overlayLight,
    borderRadius: 12,
    padding: 16,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.overlayMedium,
  },
  infoLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  infoValue: {
    fontSize: 14,
    color: colors.textLight,
    fontWeight: '500',
  },
  techStack: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  techItem: {
    backgroundColor: colors.primary,
    color: colors.textLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    fontSize: 12,
    fontWeight: '500',
  },
  contactInfo: {
    backgroundColor: colors.overlayLight,
    borderRadius: 12,
    padding: 16,
  },
  contactText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 8,
  },
  footer: {
    alignItems: 'center',
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: colors.overlayMedium,
  },
  copyrightText: {
    fontSize: 12,
    color: colors.gray400,
    textAlign: 'center',
    marginBottom: 4,
  },
});

export default AppInfoScreen;
