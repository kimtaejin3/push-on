import React from 'react';
import {Alert, SafeAreaView, ScrollView, StyleSheet, Switch, Text, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useQuery, useQueryClient} from '@tanstack/react-query';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import Header from '../components/common/Header';
import Stepper from '../components/features/workout/Stepper';
import WeekDots from '../components/features/streak/WeekDots';
import {colors} from '../constants/colors';
import {MAX_FREEZES} from '../domain/streak';
import type {StreakReminderSettings} from '../domain/streakNotifications';
import {useStreak} from '../hooks/useStreak';
import {requestNotificationPermission} from '../services/workoutReminder';
import {queryKeys} from '../tanstack-query/queryKeys';
import {loadStreakReminder, saveStreakReminder} from '../utils/streakStorage';

// 저녁 알림이 22:30 고정 마지막 알림보다 늘 먼저 오도록 시는 21시까지만 고를 수 있다
const MAX_REMINDER_HOUR = 21;

function StreakScreen() {
  const navigation = useNavigation();
  const streak = useStreak();
  const queryClient = useQueryClient();
  // StreakRuntime 과 같은 쿼리를 읽는다 → 여기서 바꾸면 알림이 곧바로 다시 계획된다
  const {data: stored} = useQuery({
    queryKey: queryKeys.streak.reminder,
    queryFn: loadStreakReminder,
    staleTime: Infinity,
  });
  // 예전에 저장된 시가 21시보다 늦으면 21시로 보여 주고, 다음에 바꿀 때 그 값으로 저장한다
  const reminder = stored && {...stored, hour: Math.min(stored.hour, MAX_REMINDER_HOUR)};

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
      const granted = await requestNotificationPermission();
      if (!granted) {
        Alert.alert('알림 권한 필요', '설정에서 푸쉬온의 알림을 허용해 주세요.');
        return;
      }
    }
    await apply({...reminder, enabled});
  };

  const back = () => navigation.goBack();

  if (!streak) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="스트릭" onBackPress={back} />
        <View style={styles.empty}>
          <Text style={styles.emptyText}>스트릭 정보를 불러오지 못했어요</Text>
        </View>
      </SafeAreaView>
    );
  }

  const {current, todayDone, longest, freezes, week, nextMilestone} = streak;

  return (
    <SafeAreaView style={styles.container}>
      <Header title="스트릭" onBackPress={back} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <FontAwesome6
            name="fire"
            size={44}
            color={todayDone ? colors.primary : colors.gray700}
            iconStyle="solid"
          />
          <Text style={styles.heroNumber}>{current}</Text>
          <Text style={styles.heroLabel}>{current}일 연속</Text>
          {!todayDone && current >= 1 && (
            <Text style={styles.hint}>오늘 운동하면 {current + 1}일째예요</Text>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>이번 주</Text>
          <WeekDots week={week} />
        </View>

        <View style={styles.card}>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>최고 기록</Text>
            <Text style={styles.statValue}>{longest}일</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>다음 목표</Text>
            <Text style={styles.statValue}>
              {nextMilestone === null
                ? '모든 목표 달성'
                : `${nextMilestone}일까지 ${nextMilestone - current}일 남음`}
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.statRow}>
            <View style={styles.freezeTitle}>
              <FontAwesome6 name="snowflake" size={16} color={colors.lightBlue} iconStyle="solid" />
              <Text style={styles.statLabel}>스트릭 보호권</Text>
            </View>
            <Text style={styles.statValue}>
              {freezes} / {MAX_FREEZES}
            </Text>
          </View>
          <Text style={styles.hint}>
            7일 이어갈 때마다 1개씩, 최대 {MAX_FREEZES}개까지 쌓여요.{'\n'}
            하루 빠지면 자동으로 써서 스트릭을 지켜줘요.
          </Text>
        </View>

        {reminder && (
          <View style={styles.reminderCard}>
            <View style={styles.statRow}>
              <Text style={styles.cardTitle}>스트릭 알림</Text>
              <Switch
                value={reminder.enabled}
                onValueChange={handleToggle}
                trackColor={{true: colors.primary, false: colors.overlayMedium}}
                thumbColor={colors.textLight}
              />
            </View>
            <Text style={styles.hint}>
              그날 아직 운동하지 않았으면 이 시각에 알려줘요. 22시 30분에 한 번 더 알려줘요.
            </Text>
            {reminder.enabled && (
              <>
                <Stepper
                  label="시간"
                  value={reminder.hour}
                  unit="시"
                  min={0}
                  max={MAX_REMINDER_HOUR}
                  step={1}
                  onChange={hour => apply({...reminder, hour})}
                />
                <Stepper
                  label="분"
                  value={reminder.minute}
                  unit="분"
                  min={0}
                  max={55}
                  step={5}
                  onChange={minute => apply({...reminder, minute})}
                />
              </>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.backgroundDark},
  content: {padding: 20, gap: 16},
  empty: {flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20},
  emptyText: {fontSize: 16, color: colors.textSecondary},
  hero: {alignItems: 'center', paddingVertical: 16, gap: 4},
  heroNumber: {fontSize: 64, fontWeight: 'bold', color: colors.textLight, marginTop: 8},
  heroLabel: {fontSize: 18, fontWeight: '600', color: colors.textLight},
  card: {backgroundColor: colors.overlayLight, borderRadius: 16, padding: 20, gap: 12},
  reminderCard: {
    backgroundColor: colors.overlayLight,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 4,
  },
  cardTitle: {fontSize: 16, fontWeight: '600', color: colors.textLight},
  statRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  statLabel: {fontSize: 15, color: colors.textLight},
  statValue: {fontSize: 15, fontWeight: '600', color: colors.primaryLight},
  freezeTitle: {flexDirection: 'row', alignItems: 'center', gap: 8},
  hint: {fontSize: 13, lineHeight: 19, color: colors.gray400},
});

export default StreakScreen;
