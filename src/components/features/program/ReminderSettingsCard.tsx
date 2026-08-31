import React, {useEffect, useState} from 'react';
import {Alert, Pressable, StyleSheet, Switch, Text, View} from 'react-native';
import {colors} from '../../../constants/colors';
import Stepper from '../workout/Stepper';
import {
  MAX_REMINDER_DAYS,
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

  const isFull = settings.days.length >= MAX_REMINDER_DAYS;

  const toggleDay = (day: number) => {
    const selected = settings.days.includes(day);
    if (!selected && isFull) {
      return; // 최대 3일
    }
    const days = selected
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
              const disabled = !selected && isFull;
              return (
                <Pressable
                  key={label}
                  onPress={() => toggleDay(day)}
                  disabled={disabled}
                  style={[styles.day, selected && styles.daySelected, disabled && styles.dayDisabled]}>
                  <Text style={[styles.dayText, selected && styles.dayTextSelected]}>
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={styles.hint}>
            주 {MAX_REMINDER_DAYS}일 프로그램이라 최대 {MAX_REMINDER_DAYS}일까지 고를 수 있어요
          </Text>
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
  dayDisabled: {opacity: 0.35},
  hint: {fontSize: 12, color: colors.gray400, marginBottom: 4},
  dayText: {fontSize: 14, color: colors.textSecondary},
  dayTextSelected: {color: colors.textLight, fontWeight: '600'},
});

export default ReminderSettingsCard;
