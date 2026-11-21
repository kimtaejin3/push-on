import React, {useCallback, useEffect, useState} from 'react';
import {
  AppState,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {queryOptions, useQuery, useQueryClient} from '@tanstack/react-query';
import notifee, {AuthorizationStatus} from '@notifee/react-native';
import {Button} from '../components/ui/Button';
import {Icon} from '../components/ui/Icon';
import {Row} from '../components/ui/Row';
import {ScreenHeader} from '../components/ui/ScreenHeader';
import {Stepper} from '../components/ui/Stepper';
import {Text} from '../components/ui/Text';
import {Toggle} from '../components/ui/Toggle';
import {useToast} from '../components/ui/feedback/ToastProvider';
import {
  requestNotificationPermission,
  syncWorkoutReminders,
} from '../services/workoutReminder';
import {color, layout, radius, space} from '../theme';
import {
  MAX_REMINDER_DAYS,
  type ReminderSettings,
  clampReminderSettings,
  loadReminderSettings,
  saveReminderSettings,
} from '../utils/reminder';

/** 폰에 저장된 100개 챌린지 운동 알림 설정. 설정 탭 요약과 이 화면이 같은 캐시를 본다 */
export const reminderSettingsQuery = queryOptions({
  queryKey: ['workoutReminder'] as const,
  queryFn: loadReminderSettings,
  networkMode: 'always',
});

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];
// 화면과 요약은 월요일부터 보여 준다 (저장 값은 0=일 ~ 6=토 그대로)
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];

export function formatReminderTime(hour: number, minute: number): string {
  const meridiem = hour < 12 ? '오전' : '오후';
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${meridiem} ${h12}:${String(minute).padStart(2, '0')}`;
}

/** 설정 탭 행에 보이는 요약: "꺼짐" / "매일 오후 8:00" / "월·수·금 오후 8:00" */
export function reminderSummary(settings: ReminderSettings): string {
  if (!settings.enabled) {
    return '꺼짐';
  }
  const time = formatReminderTime(settings.hour, settings.minute);
  if (settings.days.length >= MAX_REMINDER_DAYS) {
    return `매일 ${time}`;
  }
  const days = WEEK_ORDER.filter(day => settings.days.includes(day))
    .map(day => DAY_NAMES[day])
    .join('·');
  return `${days} ${time}`;
}

// services/workoutReminder 가 보내는 알림과 같은 문구 (미리 보기용)
const PREVIEW_TITLE = '푸쉬온';
const PREVIEW_BODY = '오늘은 푸쉬업 하는 날이에요. 100개 챌린지 이어가요!';

/** 설정 → 운동 알림. 값이 바뀔 때마다 저장하고 알림을 다시 건다. */
function WorkoutReminderScreen() {
  const navigation = useNavigation();
  const toast = useToast();
  const queryClient = useQueryClient();
  const {data: settings} = useQuery(reminderSettingsQuery);
  // 켜려다 권한을 받지 못한 경우. 휴대폰 설정에서 허용하고 돌아오면 풀린다
  const [requestFailed, setRequestFailed] = useState(false);
  // 휴대폰 설정에서 알림이 막혀 있는지 (켜 둔 알림이 실제로 오지 않는 상태 안내용)
  const [systemBlocked, setSystemBlocked] = useState(false);

  const checkPermission = useCallback(async () => {
    try {
      const {authorizationStatus} = await notifee.getNotificationSettings();
      setSystemBlocked(authorizationStatus === AuthorizationStatus.DENIED);
      if (authorizationStatus >= AuthorizationStatus.AUTHORIZED) {
        setRequestFailed(false);
      }
    } catch {
      // 권한 상태를 읽지 못해도 화면은 그대로 쓴다
    }
  }, []);

  useEffect(() => {
    checkPermission();
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') {
        checkPermission();
      }
    });
    return () => subscription.remove();
  }, [checkPermission]);

  const apply = async (next: ReminderSettings) => {
    const clamped = clampReminderSettings(next);
    queryClient.setQueryData(reminderSettingsQuery.queryKey, clamped);
    try {
      await saveReminderSettings(clamped);
      await syncWorkoutReminders(clamped);
    } catch (e) {
      console.error('알림 등록 실패:', e);
      toast.show('알림을 예약하지 못했어요', {tone: 'alert'});
    }
  };

  if (!settings) {
    return (
      <SafeAreaView style={styles.screen}>
        <ScreenHeader title="운동 알림" onBack={() => navigation.goBack()} />
      </SafeAreaView>
    );
  }

  const handleToggle = async (enabled: boolean) => {
    if (enabled) {
      const granted = await requestNotificationPermission();
      if (!granted) {
        setRequestFailed(true);
        return;
      }
      setRequestFailed(false);
    }
    await apply({...settings, enabled});
  };

  const toggleDay = (day: number) => {
    const selected = settings.days.includes(day);
    const days = selected
      ? settings.days.filter(d => d !== day)
      : [...settings.days, day];
    if (days.length === 0) {
      toast.show('하루 이상은 골라야 해요'); // 최소 하루는 남긴다
      return;
    }
    apply({...settings, days});
  };

  const showBanner = requestFailed || (systemBlocked && settings.enabled);
  // 꺼진 상태에서 권한이 없으면 켤 수 없다. 켜져 있으면 끄는 건 언제든 가능
  const toggleDisabled = requestFailed && !settings.enabled;
  // 매일 하는 프로그램이라, 빠진 요일이 있으면 모두 켜 두길 권한다
  const isPartial = settings.days.length < MAX_REMINDER_DAYS;
  const time = formatReminderTime(settings.hour, settings.minute);

  return (
    <SafeAreaView style={styles.screen}>
      <ScreenHeader title="운동 알림" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content}>
        {showBanner && (
          <View style={styles.banner}>
            <View style={styles.bannerCopy}>
              <Icon name="bell" size={18} color="alert" />
              <View style={styles.flex}>
                <Text weight={700}>알림이 꺼져 있어요</Text>
                <Text variant="caption" color="textMuted">
                  휴대폰 설정에서 푸쉬온 알림을 허용해야 울려요.
                </Text>
              </View>
            </View>
            <Button
              variant="secondary"
              title="설정 열기"
              onPress={() => Linking.openSettings()}
            />
          </View>
        )}

        <Row
          title="운동 알림"
          subtitle="정한 시간에 오늘 운동을 알려 드려요"
          right={
            <Toggle
              value={settings.enabled}
              onChange={handleToggle}
              disabled={toggleDisabled}
            />
          }
        />

        <View
          style={[styles.section, !settings.enabled && styles.dimmed]}
          pointerEvents={settings.enabled ? 'auto' : 'none'}>
          <Text variant="caption" color="textMuted" weight={600}>
            요일
          </Text>
          <View style={styles.days}>
            {WEEK_ORDER.map(day => {
              const selected = settings.days.includes(day);
              return (
                <Pressable
                  key={day}
                  accessibilityRole="button"
                  accessibilityLabel={`${DAY_NAMES[day]}요일`}
                  accessibilityState={{
                    selected,
                    disabled: !settings.enabled,
                  }}
                  disabled={!settings.enabled}
                  onPress={() => toggleDay(day)}
                  style={({pressed}) => [
                    styles.day,
                    selected && styles.daySelected,
                    pressed && styles.pressed,
                  ]}>
                  <Text
                    variant="label"
                    weight={700}
                    color={selected ? 'onBrand' : 'textMuted'}>
                    {DAY_NAMES[day]}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          {isPartial && (
            <View style={styles.hint}>
              <Icon name="info" size={14} color="textMuted" />
              <Text variant="caption" color="textMuted" style={styles.flex}>
                매일 하는 프로그램이에요. 요일을 모두 켜 두는 걸 권해요
              </Text>
            </View>
          )}
        </View>

        <View
          style={[styles.section, !settings.enabled && styles.dimmed]}
          pointerEvents={settings.enabled ? 'auto' : 'none'}>
          <Text variant="caption" color="textMuted" weight={600}>
            시간
          </Text>
          <Row title="알림 시간" icon="bell" value={time} />
          <Stepper
            label="시"
            value={settings.hour}
            unit="시"
            min={0}
            max={23}
            onChange={hour => apply({...settings, hour})}
          />
          <Stepper
            label="분"
            value={settings.minute}
            unit="분"
            min={0}
            max={55}
            step={5}
            onChange={minute => apply({...settings, minute})}
          />
        </View>

        {settings.enabled && (
          <View style={styles.section}>
            <Text variant="caption" color="textMuted" weight={600}>
              이렇게 와요
            </Text>
            <View style={styles.preview}>
              <View style={styles.previewIcon}>
                <Icon name="zap" size={18} color="onBrand" />
              </View>
              <View style={styles.flex}>
                <View style={styles.previewHead}>
                  <Text variant="label" weight={700} style={styles.flex}>
                    {PREVIEW_TITLE}
                  </Text>
                  <Text variant="caption" color="textMuted">
                    {time}
                  </Text>
                </View>
                <Text variant="caption">{PREVIEW_BODY}</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: color.bg},
  content: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: space[8],
    paddingBottom: space[48],
    gap: space[24],
  },
  flex: {flex: 1},
  banner: {
    gap: space[12],
    padding: space[16],
    borderRadius: radius.m,
    borderWidth: 1,
    borderColor: `${color.alert}59`,
    backgroundColor: `${color.alert}14`,
  },
  bannerCopy: {flexDirection: 'row', gap: space[12]},
  section: {gap: space[12]},
  dimmed: {opacity: 0.4},
  days: {flexDirection: 'row', gap: 6},
  day: {
    flex: 1,
    height: layout.touchMin,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: color.surface2,
    borderWidth: 1,
    borderColor: color.border,
  },
  daySelected: {
    backgroundColor: color.activeButton,
    borderColor: color.activeButton,
  },
  pressed: {opacity: 0.7},
  hint: {flexDirection: 'row', alignItems: 'center', gap: 6},
  preview: {
    flexDirection: 'row',
    gap: space[12],
    padding: 14,
    borderRadius: radius.l,
    backgroundColor: color.surface2,
  },
  previewIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: color.activeButton,
  },
  previewHead: {flexDirection: 'row', alignItems: 'center', gap: space[8]},
});

export default WorkoutReminderScreen;
