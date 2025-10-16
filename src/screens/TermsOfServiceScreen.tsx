import React from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import Fontawesome5 from '@react-native-vector-icons/fontawesome5';
import {colors} from '../constants/colors';

interface TermsOfServiceScreenProps {
  navigation: any;
}

function TermsOfServiceScreen({navigation}: TermsOfServiceScreenProps) {
  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Fontawesome5
            name="arrow-left"
            size={20}
            iconStyle="solid"
            color={colors.textLight}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>이용약관</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          {/* 약관 헤더 */}
          <View style={styles.termsHeader}>
            <Text style={styles.termsTitle}>PushOn 서비스 이용약관</Text>
            <Text style={styles.effectiveDate}>시행일: 2025년 1월 16일</Text>
          </View>

          {/* 제1조 */}
          <View style={styles.article}>
            <Text style={styles.articleTitle}>제1조 (목적)</Text>
            <Text style={styles.articleContent}>
              본 약관은 PushOn(이하 "회사")이 제공하는 푸쉬업 카운팅 서비스(이하 "서비스")의 이용과 관련하여 회사와 이용자 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.
            </Text>
          </View>

          {/* 제2조 */}
          <View style={styles.article}>
            <Text style={styles.articleTitle}>제2조 (정의)</Text>
            <Text style={styles.articleContent}>
              1. "서비스"란 얼굴인식 기술을 활용한 푸쉬업 자동 카운팅, 운동 기록 관리, 통계 분석 등의 기능을 제공하는 모바일 애플리케이션을 의미합니다.{'\n\n'}
              2. "이용자"란 서비스에 접속하여 본 약관에 따라 서비스를 이용하는 회원 및 비회원을 의미합니다.{'\n\n'}
              3. "회원"이란 서비스에 개인정보를 제공하여 회원등록을 한 자로서, 서비스의 정보를 지속적으로 제공받으며 서비스를 계속적으로 이용할 수 있는 자를 의미합니다.
            </Text>
          </View>

          {/* 제3조 */}
          <View style={styles.article}>
            <Text style={styles.articleTitle}>제3조 (약관의 효력 및 변경)</Text>
            <Text style={styles.articleContent}>
              1. 본 약관은 서비스를 이용하고자 하는 모든 이용자에게 그 효력이 발생합니다.{'\n\n'}
              2. 회사는 필요하다고 인정되는 경우 본 약관을 변경할 수 있으며, 변경된 약관은 서비스 내 공지사항을 통해 공지합니다.{'\n\n'}
              3. 이용자가 변경된 약관에 동의하지 않는 경우 서비스 이용을 중단할 수 있습니다.
            </Text>
          </View>

          {/* 제4조 */}
          <View style={styles.article}>
            <Text style={styles.articleTitle}>제4조 (서비스의 제공)</Text>
            <Text style={styles.articleContent}>
              1. 회사는 다음과 같은 서비스를 제공합니다:{'\n'}
              • 얼굴인식 기반 푸쉬업 자동 카운팅{'\n'}
              • 운동 기록 및 히스토리 관리{'\n'}
              • 운동 통계 및 분석{'\n'}
              • 챌린지 및 목표 설정{'\n'}
              • 기타 회사가 정하는 서비스{'\n\n'}
              2. 서비스는 연중무휴, 1일 24시간 제공함을 원칙으로 합니다.{'\n\n'}
              3. 회사는 컴퓨터 등 정보통신설비의 보수점검, 교체 및 고장, 통신의 두절 등의 사유가 발생한 경우에는 서비스의 제공을 일시적으로 중단할 수 있습니다.
            </Text>
          </View>

          {/* 제5조 */}
          <View style={styles.article}>
            <Text style={styles.articleTitle}>제5조 (서비스의 변경 및 중단)</Text>
            <Text style={styles.articleContent}>
              1. 회사는 운영정책상 또는 기술상의 필요에 의하여 제공하고 있는 전부 또는 일부 서비스를 변경할 수 있습니다.{'\n\n'}
              2. 서비스의 내용, 이용방법, 이용시간에 대하여 변경이 있는 경우에는 변경사유, 변경될 서비스의 내용 및 제공일자 등을 그 변경 전에 서비스 내 공지사항으로 공지합니다.{'\n\n'}
              3. 회사는 무료로 제공되는 서비스의 일부 또는 전부를 회사의 정책 및 운영의 필요상 수정, 중단, 변경할 수 있으며, 이에 대하여 관련법에 특별한 규정이 없는 한 이용자에게 별도의 보상을 하지 않습니다.
            </Text>
          </View>

          {/* 제6조 */}
          <View style={styles.article}>
            <Text style={styles.articleTitle}>제6조 (이용자의 의무)</Text>
            <Text style={styles.articleContent}>
              1. 이용자는 다음 행위를 하여서는 안 됩니다:{'\n'}
              • 신청 또는 변경시 허위내용의 등록{'\n'}
              • 타인의 정보 도용{'\n'}
              • 회사가 게시한 정보의 변경{'\n'}
              • 회사가 정한 정보 이외의 정보(컴퓨터 프로그램 등) 등의 송신 또는 게시{'\n'}
              • 회사 기타 제3자의 저작권 등 지적재산권에 대한 침해{'\n'}
              • 회사 기타 제3자의 명예를 손상시키거나 업무를 방해하는 행위{'\n'}
              • 외설 또는 폭력적인 메시지, 화상, 음성, 기타 공서양속에 반하는 정보를 서비스에 공개 또는 게시하는 행위{'\n\n'}
              2. 이용자는 서비스 이용과 관련하여 관련법령, 본 약관의 규정, 이용안내 및 서비스와 관련하여 공지한 주의사항을 준수하여야 합니다.
            </Text>
          </View>

          {/* 제7조 */}
          <View style={styles.article}>
            <Text style={styles.articleTitle}>제7조 (개인정보보호)</Text>
            <Text style={styles.articleContent}>
              1. 회사는 이용자의 개인정보 수집시 서비스제공을 위하여 필요한 범위에서 최소한의 개인정보를 수집합니다.{'\n\n'}
              2. 회사는 회원가입시 구매계약이행에 필요한 정보를 미리 수집하지 않습니다.{'\n\n'}
              3. 회사는 이용자의 개인정보를 수집·이용하는 때에는 당해 이용자에게 그 목적을 고지하고 동의를 받습니다.{'\n\n'}
              4. 회사는 수집된 개인정보를 목적외의 용도로 이용할 수 없으며, 새로운 이용목적이 발생한 경우 또는 제3자에게 제공하는 경우에는 이용·제공단계에서 당해 이용자에게 그 목적을 고지하고 동의를 받습니다.
            </Text>
          </View>

          {/* 제8조 */}
          <View style={styles.article}>
            <Text style={styles.articleTitle}>제8조 (회사의 의무)</Text>
            <Text style={styles.articleContent}>
              1. 회사는 법령과 본 약관이 금지하거나 공서양속에 반하는 행위를 하지 않으며 본 약관이 정하는 바에 따라 지속적이고, 안정적으로 서비스를 제공하는데 최선을 다하여야 합니다.{'\n\n'}
              2. 회사는 이용자가 안전하게 인터넷 서비스를 이용할 수 있도록 이용자의 개인정보(신용정보 포함)보호를 위한 보안 시스템을 구축하여야 합니다.{'\n\n'}
              3. 회사는 이용자가 원하지 않는 영리목적의 광고성 전자우편을 발송하지 않습니다.
            </Text>
          </View>

          {/* 제9조 */}
          <View style={styles.article}>
            <Text style={styles.articleTitle}>제9조 (손해배상)</Text>
            <Text style={styles.articleContent}>
              1. 회사가 제공하는 서비스로 인하여 이용자에게 손해가 발생한 경우 그러한 손해가 회사의 고의나 중대한 과실에 의한 경우를 제외하고는 회사에서 책임지지 않습니다.{'\n\n'}
              2. 회사는 이용자가 서비스를 이용하여 기대하는 수익을 상실한 것에 대하여 책임을 지지 않으며 그 밖에 서비스를 통하여 얻은 자료로 인한 손해에 관하여 책임을 지지 않습니다.
            </Text>
          </View>

          {/* 제10조 */}
          <View style={styles.article}>
            <Text style={styles.articleTitle}>제10조 (준거법 및 관할법원)</Text>
            <Text style={styles.articleContent}>
              1. 서비스 이용으로 발생한 분쟁에 대해 소송이 제기되는 경우 회사의 본사 소재지를 관할하는 법원을 전속 관할 법원으로 합니다.{'\n\n'}
              2. 본 약관은 대한민국 법령에 따라 규율되고 해석됩니다.
            </Text>
          </View>

          {/* 부칙 */}
          <View style={styles.article}>
            <Text style={styles.articleTitle}>부칙</Text>
            <Text style={styles.articleContent}>
              본 약관은 2025년 1월 16일부터 시행합니다.
            </Text>
          </View>

          {/* 문의 정보 */}
          <View style={styles.contactSection}>
            <Text style={styles.contactTitle}>문의사항</Text>
            <Text style={styles.contactText}>
              본 약관에 대한 문의사항이 있으시면 설정 > 문의하기를 통해 연락해주세요.
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.primary,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textLight,
  },
  placeholder: {
    width: 36,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  termsHeader: {
    alignItems: 'center',
    marginBottom: 30,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.primary,
  },
  termsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textLight,
    textAlign: 'center',
    marginBottom: 8,
  },
  effectiveDate: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  article: {
    marginBottom: 24,
  },
  articleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 8,
  },
  articleContent: {
    fontSize: 14,
    color: colors.textLight,
    lineHeight: 22,
  },
  contactSection: {
    marginTop: 20,
    padding: 16,
    backgroundColor: colors.overlayLight,
    borderRadius: 12,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textLight,
    marginBottom: 8,
  },
  contactText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});

export default TermsOfServiceScreen;
