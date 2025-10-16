import React from 'react';
import {SafeAreaView, StyleSheet, Text, View, ScrollView} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {colors} from '../constants/colors';
import Header from '../components/common/Header';

function PrivacyPolicyScreen() {
  const navigation = useNavigation();
  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <Header
        title="개인정보처리방침"
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          {/* 개인정보처리방침 헤더 */}
          <View style={styles.policyHeader}>
            <Text style={styles.policyTitle}>PushOn 개인정보처리방침</Text>
            <Text style={styles.effectiveDate}>시행일: 2025년 10월 24일</Text>
          </View>

          {/* 개요 */}
          <View style={styles.article}>
            <Text style={styles.articleContent}>
              PushOn(이하 "회사")는 「개인정보 보호법」, 「정보통신망 이용촉진
              및 정보보호 등에 관한 법률」 등 관련 법령에 따라 이용자의
              개인정보를 보호하고 이와 관련한 고충을 신속하고 원활하게 처리할 수
              있도록 다음과 같이 개인정보처리방침을 수립·공개합니다.
            </Text>
          </View>

          {/* 제1조 */}
          <View style={styles.article}>
            <Text style={styles.articleTitle}>
              제1조 (개인정보의 수집 및 이용목적)
            </Text>
            <Text style={styles.articleContent}>
              회사는 다음의 목적을 위하여 개인정보를 처리합니다:{'\n\n'}
              1. 서비스 제공{'\n'}• 얼굴인식 기반 푸쉬업 카운팅 서비스 제공
              {'\n'}• 운동 기록 및 통계 분석 서비스 제공{'\n'}• 챌린지 및 목표
              설정 기능 제공{'\n\n'}
              2. 회원관리{'\n'}• 회원 식별 및 본인확인{'\n'}• 회원가입 및
              가입의사 확인{'\n'}• 불량회원의 부정 이용 방지와 비인가 사용 방지
              {'\n\n'}
              3. 서비스 개선{'\n'}• 서비스 이용 통계 분석{'\n'}• 맞춤형 서비스
              제공{'\n'}• 신규 서비스 개발 및 특화
            </Text>
          </View>

          {/* 제2조 */}
          <View style={styles.article}>
            <Text style={styles.articleTitle}>
              제2조 (수집하는 개인정보의 항목)
            </Text>
            <Text style={styles.articleContent}>
              <Text style={styles.subTitle}>1. 필수 수집 항목</Text>
              {'\n'}• 회원가입 시: 이메일 주소, 닉네임{'\n'}• 서비스 이용 시:
              운동 기록, 얼굴인식 데이터(로컬 처리){'\n\n'}
              <Text style={styles.subTitle}>2. 자동 수집 항목</Text>
              {'\n'}• 서비스 이용 기록, 접속 로그, 쿠키, 접속 IP 정보{'\n'}•
              단말기 정보(OS, 기기 모델명, 앱 버전){'\n\n'}
              <Text style={styles.subTitle}>3. 선택 수집 항목</Text>
              {'\n'}• 프로필 사진, 운동 목표 설정{'\n'}• 마케팅 정보 수신 동의
              시: 푸시 알림 설정
            </Text>
          </View>

          {/* 제3조 */}
          <View style={styles.article}>
            <Text style={styles.articleTitle}>제3조 (개인정보의 수집방법)</Text>
            <Text style={styles.articleContent}>
              1. 회원가입 및 서비스 이용 과정에서 이용자가 개인정보 수집에 대해
              동의를 하고 직접 정보를 입력하는 경우{'\n\n'}
              2. 생성정보 수집 도구를 통한 자동 수집{'\n\n'}
              3. 제휴사로부터의 제공{'\n\n'}
              4. 고객센터를 통한 상담 과정에서 웹페이지, 메일, 팩스, 전화 등을
              통한 수집
            </Text>
          </View>

          {/* 제4조 */}
          <View style={styles.article}>
            <Text style={styles.articleTitle}>
              제4조 (개인정보의 보유 및 이용기간)
            </Text>
            <Text style={styles.articleContent}>
              <Text style={styles.subTitle}>
                1. 회사는 원칙적으로 개인정보 수집 및 이용목적이 달성된 후에는
                해당 정보를 지체없이 파기합니다.
              </Text>
              {'\n\n'}
              <Text style={styles.subTitle}>
                2. 다음의 정보에 대해서는 아래의 이유로 명시한 기간 동안
                보존합니다.
              </Text>
              {'\n\n'}• 회원 정보: 회원 탈퇴 시까지{'\n'}• 운동 기록: 회원 탈퇴
              후 1년{'\n'}• 서비스 이용 기록: 3개월{'\n'}• 부정이용 기록: 1년
              {'\n\n'}
              <Text style={styles.subTitle}>
                3. 관련 법령에 의한 정보보유 사유
              </Text>
              {'\n'}• 「전자상거래 등에서의 소비자보호에 관한 법률」: 5년{'\n'}•
              「통신비밀보호법」: 3개월
            </Text>
          </View>

          {/* 제5조 */}
          <View style={styles.article}>
            <Text style={styles.articleTitle}>
              제5조 (개인정보의 제3자 제공)
            </Text>
            <Text style={styles.articleContent}>
              회사는 원칙적으로 이용자의 개인정보를 외부에 제공하지 않습니다.
              다만, 아래의 경우에는 예외로 합니다:{'\n\n'}
              1. 이용자들이 사전에 동의한 경우{'\n\n'}
              2. 법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차와
              방법에 따라 수사기관의 요구가 있는 경우{'\n\n'}
              3. 통계작성, 학술연구 또는 시장조사를 위하여 필요한 경우로서 특정
              개인을 식별할 수 없는 형태로 제공하는 경우
            </Text>
          </View>

          {/* 제6조 */}
          <View style={styles.article}>
            <Text style={styles.articleTitle}>제6조 (개인정보처리의 위탁)</Text>
            <Text style={styles.articleContent}>
              회사는 서비스 제공을 위해 다음과 같이 개인정보 처리를 위탁하고
              있습니다:{'\n\n'}
              <Text style={styles.subTitle}>
                • Supabase (데이터베이스 서비스)
              </Text>
              {'\n'}- 위탁업무: 회원 정보 및 운동 기록 저장{'\n'}- 보유 및
              이용기간: 회원 탈퇴 시까지{'\n\n'}
              <Text style={styles.subTitle}>
                • Google Analytics (분석 서비스)
              </Text>
              {'\n'}- 위탁업무: 서비스 이용 통계 분석{'\n'}- 보유 및 이용기간:
              익명화된 통계 데이터
            </Text>
          </View>

          {/* 제7조 */}
          <View style={styles.article}>
            <Text style={styles.articleTitle}>
              제7조 (개인정보의 안전성 확보조치)
            </Text>
            <Text style={styles.articleContent}>
              회사는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취하고
              있습니다:{'\n\n'}
              1. 관리적 조치: 내부관리계획 수립, 전담조직 운영, 정기적 직원 교육
              {'\n\n'}
              2. 기술적 조치: 개인정보처리시스템 등의 접근권한 관리,
              접근통제시스템 설치, 개인정보의 암호화, 보안프로그램 설치{'\n\n'}
              3. 물리적 조치: 전산실, 자료보관실 등의 접근통제
            </Text>
          </View>

          {/* 제8조 */}
          <View style={styles.article}>
            <Text style={styles.articleTitle}>제8조 (개인정보보호책임자)</Text>
            <Text style={styles.articleContent}>
              회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보
              처리와 관련한 정보주체의 불만처리 및 피해구제 등을 위하여 아래와
              같이 개인정보보호책임자를 지정하고 있습니다:{'\n\n'}
              <Text style={styles.subTitle}>개인정보보호책임자</Text>
              {'\n'}• 성명: PushOn 개인정보보호책임자{'\n'}• 연락처: 설정 →
              문의하기를 통해 연락{'\n\n'}
              정보주체께서는 회사의 서비스를 이용하시면서 발생한 모든 개인정보
              보호 관련 문의, 불만처리, 피해구제 등에 관한 사항을
              개인정보보호책임자에게 문의하실 수 있습니다.
            </Text>
          </View>

          {/* 제9조 */}
          <View style={styles.article}>
            <Text style={styles.articleTitle}>
              제9조 (정보주체의 권리·의무 및 행사방법)
            </Text>
            <Text style={styles.articleContent}>
              이용자는 개인정보주체로서 다음과 같은 권리를 행사할 수 있습니다:
              {'\n\n'}
              1. 개인정보 처리현황 통지요구{'\n'}
              2. 개인정보 열람요구{'\n'}
              3. 개인정보 정정·삭제요구{'\n'}
              4. 개인정보 처리정지요구{'\n\n'}
              권리 행사는 회사에 대해 서면, 전화, 전자우편, 모사전송(FAX) 등을
              통하여 하실 수 있으며 회사는 이에 대해 지체없이 조치하겠습니다.
            </Text>
          </View>

          {/* 제10조 */}
          <View style={styles.article}>
            <Text style={styles.articleTitle}>
              제10조 (개인정보처리방침의 변경)
            </Text>
            <Text style={styles.articleContent}>
              1. 이 개인정보처리방침은 시행일로부터 적용되며, 법령 및 방침에
              따른 변경내용의 추가, 삭제 및 정정이 있는 경우에는 변경사항의 시행
              7일 전부터 공지사항을 통하여 고지할 것입니다.{'\n\n'}
              2. 회사는 개인정보의 수집 및 활용, 제3자 제공 등 정보통신망
              이용촉진 및 정보보호 등에 관한 법률 제27조의2에 따라 이용자의
              동의를 받아야 하는 경우에는 미리 동의를 받습니다.
            </Text>
          </View>

          {/* 부칙 */}
          <View style={styles.article}>
            <Text style={styles.articleTitle}>부칙</Text>
            <Text style={styles.articleContent}>
              본 개인정보처리방침은 2025년 10월 24일부터 시행합니다.
            </Text>
          </View>

          {/* 문의 정보 */}
          <View style={styles.contactSection}>
            <Text style={styles.contactTitle}>개인정보 관련 문의</Text>
            <Text style={styles.contactText}>
              개인정보 처리에 관한 문의사항이 있으시면 설정 → 문의하기를 통해
              연락해주세요.{'\n\n'}
              개인정보보호위원회: privacy.go.kr (국번없이 182)
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
  policyHeader: {
    alignItems: 'center',
    marginBottom: 30,
    paddingBottom: 20,
  },
  policyTitle: {
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
  subTitle: {
    fontWeight: '600',
    color: colors.textLight,
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

export default PrivacyPolicyScreen;
