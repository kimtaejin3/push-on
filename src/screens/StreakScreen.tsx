import React, {useState} from 'react';
import {ScrollView, StyleSheet, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {useQuery, useQueryClient} from '@tanstack/react-query';
import WeekDots from '../components/features/streak/WeekDots';
import {
  Card,
  Icon,
  Row,
  ScreenHeader,
  Stepper,
  Text,
  Toggle,
} from '../components/ui';
import {ConfirmDialog} from '../components/ui/feedback/ConfirmDialog';
import {MAX_FREEZES} from '../domain/streak';
import type {StreakReminderSettings} from '../domain/streakNotifications';
import {useStreak} from '../hooks/useStreak';
import {requestNotificationPermission} from '../services/workoutReminder';
import {queryKeys} from '../tanstack-query/queryKeys';
import {color, layout, space} from '../theme';
import {loadStreakReminder, saveStreakReminder} from '../utils/streakStorage';

// 저녁 알림이 22:30 고정 마지막 알림보다 늘 먼저 오도록 시는 21시까지만 고를 수 있다
const MAX_REMINDER_HOUR = 21;

function StreakScreen() {
  const navigation = useNavigation();
  const streak = useStreak();
  const queryClient = useQueryClient();
  const [permissionNotice, setPermissionNotice] = useState(false);
  const closePermissionNotice = () => setPermissionNotice(false);
  // StreakRuntime 과 같은 쿼리를 읽는다 → 여기서 바꾸면 알림이 곧바로 다시 계획된다
  const {data: stored} = useQuery({
    queryKey: queryKeys.streak.reminder,
    queryFn: loadStreakReminder,
    staleTime: Infinity,
  });
  // 예전에 저장된 시가 21시보다 늦으면 21시로 보여 주고, 다음에 바꿀 때 그 값으로 저장한다
  const reminder = stored && {
    ...stored,
    hour: Math.min(stored.hour, MAX_REMINDER_HOUR),
  };
  // 예전에 저장된 56~59분은 5분씩 줄이는 동작만 허용한다
  const minuteMax = Math.max(55, reminder?.minute ?? 0);

  const apply = async (next: StreakReminderSettings) => {
    // 바로 화면과 알림 계획에 반영하고, 저장에 실패하면 폰에 남은 값으로 되돌린다
    queryClient.setQueryData(queryKeys.streak.reminder, next);
    try {
      await saveStreakReminder(next);
    } catch (e) {
      console.error('스트릭 알림 설정 저장 실패:', e);
      queryClient.invalidateQueries({queryKey: queryKeys.streak.reminder});
    }
  };

  const handleToggle = async (enabled: boolean) => {
    if (!reminder) {
      return;
    }
    if (enabled) {
      let granted = false;
      try {
        granted = await requestNotificationPermission();
      } catch (e) {
        // 권한 요청 자체가 실패하면 허용되지 않은 것으로 본다
        console.warn('알림 권한 요청 실패:', e);
      }
      if (!granted) {
        setPermissionNotice(true);
        return;
      }
    }
    await apply({...reminder, enabled});
  };

  const back = () => navigation.goBack();

  if (!streak) {
    return (
      <SafeAreaView style={styles.container}>
        <ScreenHeader title="스트릭" onBack={back} />
        <View style={styles.empty}>
          <Text color="textMuted" style={styles.centered}>
            스트릭 정보를 불러오지 못했어요
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const {current, todayDone, longest, freezes, week, nextMilestone} = streak;

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title="스트릭" onBack={back} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Icon
            name="zap"
            size={28}
            color={todayDone ? 'active' : 'textMuted'}
          />
          <View style={styles.heroValue}>
            <Text variant="hero">{current}</Text>
            <Text variant="headline" weight={800}>
              일 연속
            </Text>
          </View>
          {!todayDone && current >= 1 && (
            <Text variant="label" color="textMuted" style={styles.centered}>
              오늘 운동하면{' '}
              <Text variant="label" numeric weight={800} color="textMuted">
                {current + 1}
              </Text>
              일째예요
            </Text>
          )}
        </View>

        <Card style={styles.weekCard}>
          <Text weight={800} style={styles.weekTitle}>
            이번 주
          </Text>
          <WeekDots week={week} />
        </Card>

        <Card>
          <Row
            title="최고 기록"
            icon="trophy"
            right={
              <Text variant="label" color="record">
                <Text variant="label" numeric weight={800} color="record">
                  {longest}
                </Text>
                일
              </Text>
            }
          />
          <Row
            title="다음 목표"
            icon="flag"
            right={
              <Text variant="label" color="record" style={styles.goal}>
                {nextMilestone === null ? (
                  '모든 목표 달성'
                ) : (
                  <>
                    <Text variant="label" numeric weight={800} color="record">
                      {nextMilestone}
                    </Text>
                    일까지{' '}
                    <Text variant="label" numeric weight={800} color="record">
                      {nextMilestone - current}
                    </Text>
                    일 남음
                  </>
                )}
              </Text>
            }
          />
        </Card>

        <Card>
          <Row
            title="스트릭 보호권"
            icon="snowflake"
            right={
              <Text variant="headline" numeric weight={800} color="rest">
                {freezes} / {MAX_FREEZES}
              </Text>
            }
          />
          <Text variant="caption" color="textMuted">
            7일 이어갈 때마다 1개씩, 최대 {MAX_FREEZES}개까지 쌓여요.{'\n'}
            하루 빠지면 자동으로 써서 스트릭을 지켜줘요.
          </Text>
        </Card>

        {reminder && (
          <Card>
            <Row
              title="스트릭 알림"
              icon="bell"
              right={
                <Toggle value={reminder.enabled} onChange={handleToggle} />
              }
            />
            <Text variant="caption" color="textMuted">
              그날 아직 운동하지 않았으면 이 시각에 알려줘요. 22시 30분에 한 번
              더 알려줘요.
            </Text>
            {reminder.enabled && (
              <>
                <Stepper
                  label="시간"
                  value={reminder.hour}
                  unit="시"
                  min={0}
                  max={MAX_REMINDER_HOUR}
                  onChange={hour => apply({...reminder, hour})}
                />
                <Stepper
                  label="분"
                  value={reminder.minute}
                  unit="분"
                  min={0}
                  max={minuteMax}
                  step={5}
                  onChange={minute => apply({...reminder, minute})}
                />
              </>
            )}
          </Card>
        )}
      </ScrollView>
      <ConfirmDialog
        visible={permissionNotice}
        title="알림 권한 필요"
        message="설정에서 푸쉬온의 알림을 허용해 주세요."
        confirmLabel="확인"
        onConfirm={closePermissionNotice}
        onCancel={closePermissionNotice}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: color.bg},
  content: {padding: layout.screenPadding, gap: space[16]},
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: layout.screenPadding,
  },
  centered: {textAlign: 'center'},
  hero: {alignItems: 'center', gap: space[8]},
  heroValue: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    justifyContent: 'center',
    columnGap: space[8],
  },
  weekCard: {paddingHorizontal: space[8]},
  weekTitle: {marginHorizontal: space[12]},
  goal: {flexShrink: 1, textAlign: 'right'},
});

export default StreakScreen;
