import React from 'react';
import {Linking, ScrollView, StyleSheet, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useQuery, useQueryClient} from '@tanstack/react-query';
import {Row} from '../components/ui/Row';
import {Text} from '../components/ui/Text';
import {Toggle} from '../components/ui/Toggle';
import {useTabBarInset} from '../components/ui/TabBar';
import {useToast} from '../components/ui/feedback/ToastProvider';
import type {AppStackParamList} from '../navigations/AppNavigation';
import {queryKeys} from '../tanstack-query/queryKeys';
import {color, layout, space} from '../theme';
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
});
