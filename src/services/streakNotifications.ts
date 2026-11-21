import notifee, {AndroidImportance, TriggerType} from '@notifee/react-native';
import {STREAK_NOTIFICATION_IDS, type StreakNotification} from '../domain/streakNotifications';

// 100개 챌린지 운동 알림과 독립이라 채널도 따로 둔다 (사용자가 하나만 끌 수 있게)
const CHANNEL_ID = 'streak-reminder';

/**
 * 계획대로 스트릭 알림을 다시 건다.
 * 항상 걸 수 있는 id 전부를 먼저 지운 뒤 plan 만 새로 등록한다 (한 번만 울리는 알림, 반복 없음).
 * (정확 알람 권한이 필요 없도록 기본 스케줄러 사용 — 몇 분 오차 허용)
 */
export const syncStreakNotifications = async (plan: StreakNotification[]): Promise<void> => {
  await notifee.cancelTriggerNotifications(STREAK_NOTIFICATION_IDS);
  if (plan.length === 0) {
    return;
  }
  const channelId = await notifee.createChannel({
    id: CHANNEL_ID,
    name: '스트릭 알림',
    importance: AndroidImportance.HIGH,
  });
  await Promise.all(
    plan.map(n =>
      notifee.createTriggerNotification(
        {
          id: n.id,
          title: n.title,
          body: n.body,
          android: {channelId, pressAction: {id: 'default'}},
        },
        {type: TriggerType.TIMESTAMP, timestamp: n.at},
      ),
    ),
  );
};

export const cancelStreakNotifications = (): Promise<void> =>
  notifee.cancelTriggerNotifications(STREAK_NOTIFICATION_IDS);
