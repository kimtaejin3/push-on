import {useEffect} from 'react';
import {AppState} from 'react-native';
import {loadReminderSettings} from '../utils/reminder';
import {syncWorkoutReminders} from '../services/workoutReminder';

/**
 * 저장된 알림 설정을 실제 예약과 다시 맞춘다.
 *
 * 안드로이드에서 "강제 중지"나 제조사 배터리 관리로 예약된 알람이 지워질 수 있는데,
 * 그대로 두면 설정은 켜져 있는데 알림만 안 오는 상태가 된다.
 * 앱 시작 시와 포그라운드 복귀 시 한 번씩 다시 걸어 복구한다.
 * (syncWorkoutReminders 는 항상 기존 예약을 지우고 다시 등록하므로 여러 번 호출해도 안전)
 */
export const useReminderSync = () => {
  useEffect(() => {
    const sync = async () => {
      try {
        const settings = await loadReminderSettings();
        if (settings.enabled) {
          await syncWorkoutReminders(settings);
        }
      } catch (error) {
        console.warn('운동 알림 재등록 실패:', error);
      }
    };

    sync();

    const subscription = AppState.addEventListener('change', nextState => {
      if (nextState === 'active') {
        sync();
      }
    });

    return () => subscription.remove();
  }, []);
};
