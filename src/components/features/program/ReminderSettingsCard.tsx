import React, {useEffect, useState} from 'react';
import {Alert, Pressable, StyleSheet, Switch, Text, View} from 'react-native';
import {colors} from '../../../constants/colors';
import Stepper from '../workout/Stepper';
import {
  ReminderSettings,
  clampReminderSettings,
  loadReminderSettings,
  saveReminderSettings,
} from '../../../utils/reminder';
import {
  requestNotificationPermission,
  syncWorkoutReminders,
} from '../../../services/workoutReminder';

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

/** 100개 챌린지 운동 알림 설정 카드. 값이 바뀔 때마다 저장하고 알림을 다시 건다. */
function ReminderSettingsCard() {
  const [settings, setSettings] = useState<ReminderSettings | null>(null);

  useEffect(() => {
    loadReminderSettings().then(setSettings);
  }, []);

  if (!settings) {
    return null;
  }

  const apply = async (next: ReminderSettings) => {
    const clamped = clampReminderSettings(next);
    setSettings(clamped);
    await saveReminderSettings(clamped);
    try {
      await syncWorkoutReminders(clamped);
    } catch (e) {
      console.error('알림 등록 실패:', e);
    }
  };

  const handleToggle = async (enabled: boolean) => {
    if (enabled) {
      const granted = await requestNotificationPermission();
      if (!granted) {
        Alert.alert('알림 권한 필요', '설정에서 푸쉬온의 알림을 허용해 주세요.');
        return;
      }
    }
    await apply({...settings, enabled});
  };

  const toggleDay = (day: number) => {
    const days = settings.days.includes(day)
      ? settings.days.filter(d => d !== day)
      : [...settings.days, day];
    if (days.length === 0) {
      return; // 최소 하루는 남긴다
    }
    apply({...settings, days});
  };

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>운동 알림</Text>
        <Switch
          value={settings.enabled}
          onValueChange={handleToggle}
          trackColor={{true: colors.primary, false: colors.overlayMedium}}
          thumbColor={colors.textLight}
        />
      </View>

      {settings.enabled && (
        <>
          <View style={styles.dayRow}>
            {DAY_LABELS.map((label, day) => {
              const selected = settings.days.includes(day);
              return (
                <Pressable
                  key={label}
                  onPress={() => toggleDay(day)}
                  style={[styles.day, selected && styles.daySelected]}>
                  <Text style={[styles.dayText, selected && styles.dayTextSelected]}>
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Stepper
            label="시간"
            value={settings.hour}
            unit="시"
            min={0}
            max={23}
            step={1}
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
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.overlayLight,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {fontSize: 16, fontWeight: '600', color: colors.textLight},
  dayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  day: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.overlayMedium,
  },
  daySelected: {backgroundColor: colors.primary},
  dayText: {fontSize: 14, color: colors.textSecondary},
  dayTextSelected: {color: colors.textLight, fontWeight: '600'},
});

export default ReminderSettingsCard;
