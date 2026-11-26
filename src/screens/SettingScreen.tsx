import React, {useCallback, useEffect, useRef, useState} from 'react';
import {AppState, Linking, ScrollView, StyleSheet, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useQuery, useQueryClient} from '@tanstack/react-query';
import {AdReportSheet} from '../components/features/ads/AdReportSheet';
import {useTrackingPrePrompt} from '../components/features/ads/AdExitFlowProvider';
import {Row} from '../components/ui/Row';
import {Text} from '../components/ui/Text';
import {Toggle} from '../components/ui/Toggle';
import {useTabBarInset} from '../components/ui/TabBar';
import {useToast} from '../components/ui/feedback/ToastProvider';
import type {AppStackParamList} from '../navigations/AppNavigation';
import {queryKeys} from '../tanstack-query/queryKeys';
import {color, layout, space} from '../theme';
import {useAds} from '../hooks/useAds';
import {usePro} from '../hooks/usePro';
import {PRO_PRICE_LABEL, REVENUECAT_API_KEY} from '../constants/purchases';
import {presentProPaywall, restorePro} from '../utils/purchases';
import {
  canShowPrivacyOptions,
  getTrackingStatus,
  requestTracking,
  showPrivacyOptions,
  type TrackingStatus,
} from '../utils/adsConsent';
import {getCurrentAppVersion} from '../utils/version';
import {
  DEFAULT_WORKOUT_PREFS,
  loadWorkoutPrefs,
  saveWorkoutPrefs,
  type WorkoutPrefs,
} from '../utils/workoutPrefs';
import {reminderSettingsQuery, reminderSummary} from './WorkoutReminderScreen';

const CONTACT_EMAIL = 'rlaxowls1316@naver.com';

function Section({title, children}: {title: string; children: React.ReactNode}) {
  return (
    <View style={styles.section}>
      <Text variant="caption" color="textMuted" weight={600}>
        {title}
      </Text>
      <View>{children}</View>
    </View>
  );
}

const TRACKING_STATUS_LABEL: Record<Exclude<TrackingStatus, 'unavailable'>, string> = {
  authorized: '허용',
  denied: '허용 안 함',
  'not-determined': '아직 안 물어봄',
  restricted: '제한됨',
};

/** 평생 Pro: 구매(결제 화면)·구매 복원. Pro 면 상태만 보여 준다 */
function ProSection() {
  const isPro = usePro();
  const toast = useToast();
  const [restoring, setRestoring] = useState(false);

  if (isPro) {
    return (
      <Section title="Pro">
        <Row icon="sparkles" title="평생 Pro 사용 중" subtitle="광고 없이, 모든 기록과 연간 통계" />
      </Section>
    );
  }

  const handleBuy = async () => {
    const outcome = await presentProPaywall();
    if (outcome === 'purchased' || outcome === 'restored') {
      toast.show('평생 Pro가 됐어요. 고마워요!');
    } else if (outcome === 'unavailable' || outcome === 'error') {
      toast.show('지금은 결제를 열 수 없어요. 잠시 뒤 다시 시도해 주세요', {tone: 'alert'});
    }
  };

  const handleRestore = async () => {
    if (restoring) {
      return;
    }
    setRestoring(true);
    try {
      toast.show((await restorePro()) ? '구매를 복원했어요' : '복원할 구매가 없어요');
    } catch (error) {
      console.warn('[Pro] 복원 실패:', error);
      toast.show('복원하지 못했어요. 잠시 뒤 다시 시도해 주세요', {tone: 'alert'});
    } finally {
      setRestoring(false);
    }
  };

  // 결제를 쓸 수 없는 빌드(키 없음)에서는 섹션을 숨긴다
  if (!REVENUECAT_API_KEY) {
    return null;
  }

  return (
    <Section title="Pro">
      <Row
        icon="sparkles"
        title={`광고 없이 쓰기 · ${PRO_PRICE_LABEL}`}
        subtitle="한 번 결제로 평생 · 모든 기록과 연간 통계"
        onPress={handleBuy}
      />
      <Row icon="rotate-ccw" title="구매 복원" onPress={handleRestore} />
    </Section>
  );
}

/** 광고 동의·추적 허용·신고 방법. 서버에서 광고를 끈 동안에는 섹션 전체를 그리지 않는다 */
function AdsPrivacySection() {
  const {serverAdsEnabled} = useAds();
  const showPrePrompt = useTrackingPrePrompt();
  const [privacyOptions, setPrivacyOptions] = useState(false);
  const [tracking, setTracking] = useState<TrackingStatus>('unavailable');
  const [reportVisible, setReportVisible] = useState(false);
  const requesting = useRef(false);

  const refresh = useCallback(async () => {
    const [canShow, status] = await Promise.all([
      canShowPrivacyOptions(),
      getTrackingStatus(),
    ]);
    setPrivacyOptions(canShow);
    setTracking(status);
  }, []);

  useEffect(() => {
    if (!serverAdsEnabled) {
      return;
    }
    refresh();
    // 시스템 설정에서 추적 허용을 바꾸고 돌아오면 다시 읽는다
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') {
        refresh();
      }
    });
    return () => subscription.remove();
  }, [serverAdsEnabled, refresh]);

  const handleTrackingPress = async () => {
    if (tracking !== 'not-determined') {
      // 한 번 정한 뒤에는 앱에서 다시 물을 수 없어 시스템 설정으로 보낸다
      Linking.openSettings().catch(error => {
        console.warn('[광고] 설정 앱 열기 실패:', error);
      });
      return;
    }
    // 연타로 사전 안내·ATT 창이 두 번 뜨지 않게 막는다
    if (requesting.current) {
      return;
    }
    requesting.current = true;
    try {
      setTracking(await requestTracking(showPrePrompt));
    } finally {
      requesting.current = false;
    }
  };

  if (!serverAdsEnabled) {
    return null;
  }

  return (
    <Section title="광고와 개인정보">
      {privacyOptions ? (
        <Row icon="settings" title="맞춤 광고 동의 변경" onPress={showPrivacyOptions} />
      ) : null}
      {tracking !== 'unavailable' ? (
        <Row
          icon="lock"
          title="앱 추적 허용"
          value={TRACKING_STATUS_LABEL[tracking]}
          onPress={handleTrackingPress}
        />
      ) : null}
      <Row icon="flag" title="광고 신고하기" onPress={() => setReportVisible(true)} />
      <Text variant="caption" color="textMuted" style={styles.sectionFoot}>
        운동 기록·카메라 영상·건강 데이터는 광고에 쓰지 않아요. 운동 중에는 광고가
        나오지 않아요.
      </Text>
      <AdReportSheet visible={reportVisible} onClose={() => setReportVisible(false)} />
    </Section>
  );
}

function SettingScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const toast = useToast();
  const tabInset = useTabBarInset();
  const queryClient = useQueryClient();
  const reminder = useQuery(reminderSettingsQuery);
  // 운동 화면과 같은 캐시를 써서, 여기서 바꾸면 다음 운동부터 바로 반영된다
  const prefs = useQuery({
    queryKey: queryKeys.workoutPrefs,
    queryFn: loadWorkoutPrefs,
    networkMode: 'always',
  });

  const setAutoNextSet = async (autoNextSet: boolean) => {
    const next: WorkoutPrefs = {...(prefs.data ?? DEFAULT_WORKOUT_PREFS), autoNextSet};
    try {
      await saveWorkoutPrefs(next);
      queryClient.setQueryData(queryKeys.workoutPrefs, next);
    } catch {
      toast.show('설정을 저장하지 못했어요', {tone: 'alert'});
    }
  };

  const handleContactUs = async () => {
    try {
      await Linking.openURL(`mailto:${CONTACT_EMAIL}?subject=PushOn 문의`);
    } catch {
      // 메일 앱이 없으면 주소라도 알려 준다
      toast.show(`메일 앱이 없어요. ${CONTACT_EMAIL} 로 보내 주세요`, {
        tone: 'alert',
      });
    }
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.screen}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {paddingBottom: tabInset + space[32]},
        ]}>
        <Text variant="title" style={styles.title}>
          설정
        </Text>

        <ProSection />

        <Section title="운동">
          <Row
            icon="bell"
            title="운동 알림"
            value={reminder.data ? reminderSummary(reminder.data) : undefined}
            onPress={() => navigation.navigate('WorkoutReminder')}
          />
          <Row
            icon="play"
            title="휴식 뒤 자동으로 다음 세트"
            subtitle="휴식이 끝나면 3·2·1 뒤 바로 시작해요"
            right={
              <Toggle
                value={(prefs.data ?? DEFAULT_WORKOUT_PREFS).autoNextSet}
                onChange={setAutoNextSet}
                disabled={!prefs.data}
              />
            }
          />
        </Section>

        <Section title="계정">
          <Row
            icon="lock"
            title="계정"
            onPress={() => navigation.navigate('AccountSettings')}
          />
          <Row
            icon="settings"
            title="프로필"
            onPress={() => navigation.navigate('ProfileEdit')}
          />
        </Section>

        <AdsPrivacySection />

        <Section title="정보">
          <Row
            icon="file-text"
            title="이용약관"
            onPress={() => navigation.navigate('TermsOfService')}
          />
          <Row
            icon="file-text"
            title="개인정보 처리방침"
            onPress={() => navigation.navigate('PrivacyPolicy')}
          />
          <Row icon="inbox" title="문의하기" onPress={handleContactUs} />
          <Row icon="info" title="버전" value={getCurrentAppVersion()} />
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

export default SettingScreen;

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: color.bg},
  content: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: space[12],
    gap: 28,
  },
  title: {fontSize: 32, lineHeight: 40},
  section: {gap: space[4]},
  sectionFoot: {paddingTop: 10},
});
