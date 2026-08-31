import notifee, {
  AndroidImportance,
  AuthorizationStatus,
  RepeatFrequency,
  TriggerType,
} from '@notifee/react-native';
import {ReminderSettings, nextTriggerTimestamp} from '../utils/reminder';

const CHANNEL_ID = 'workout-reminder';
const idFor = (day: number) => `workout-reminder-${day}`;
const ALL_IDS = [0, 1, 2, 3, 4, 5, 6].map(idFor);

export const requestNotificationPermission = async (): Promise<boolean> => {
  const settings = await notifee.requestPermission();
  return settings.authorizationStatus >= AuthorizationStatus.AUTHORIZED;
};

/**
 * 설정에 맞춰 주간 반복 로컬 알림을 다시 건다.
 * 항상 기존 알림을 모두 지우고, enabled 일 때만 요일별로 새로 등록한다.
 * (정확 알람 권한이 필요 없도록 기본 스케줄러 사용 — 몇 분 오차 허용)
 */
export const syncWorkoutReminders = async (settings: ReminderSettings): Promise<void> => {
  await notifee.cancelTriggerNotifications(ALL_IDS);
  if (!settings.enabled || settings.days.length === 0) {
    return;
  }
  const channelId = await notifee.createChannel({
    id: CHANNEL_ID,
    name: '운동 알림',
    importance: AndroidImportance.HIGH,
  });
  await Promise.all(
    settings.days.map(day =>
      notifee.createTriggerNotification(
        {
          id: idFor(day),
          title: '푸쉬온',
          body: '오늘은 푸쉬업 하는 날이에요. 100개 챌린지 이어가요!',
          android: {channelId, pressAction: {id: 'default'}},
        },
        {
          type: TriggerType.TIMESTAMP,
          timestamp: nextTriggerTimestamp(day, settings.hour, settings.minute),
          repeatFrequency: RepeatFrequency.WEEKLY,
        },
      ),
    ),
  );
};

export const cancelWorkoutReminders = (): Promise<void> =>
  notifee.cancelTriggerNotifications(ALL_IDS);
