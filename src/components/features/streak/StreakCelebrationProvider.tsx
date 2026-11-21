import React, {createContext, useCallback, useContext, useEffect, useMemo, useRef, useState} from 'react';
import {Modal, Pressable, StyleSheet, Text, View} from 'react-native';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import {useQueryClient} from '@tanstack/react-query';
import CustomButton from '../../common/CustomButton';
import {colors} from '../../../constants/colors';
import {computeStreak, type StreakState} from '../../../domain/streak';
import {celebrationCopy} from '../../../domain/streakMessages';
import type {StreakReminderSettings} from '../../../domain/streakNotifications';
import {useWorkoutDates} from '../../../hooks/useStreak';
import {requestNotificationPermission} from '../../../services/workoutReminder';
import {queryKeys} from '../../../tanstack-query/queryKeys';
import {
  loadLastCelebrated,
  loadStreakReminder,
  saveLastCelebrated,
  saveStreakReminder,
} from '../../../utils/streakStorage';
import {formatKSTDate} from '../../../utils/time';
import WeekDots from './WeekDots';

type CelebrationContextValue = {celebrateThen: (next: () => void) => void};

const CelebrationContext = createContext<CelebrationContextValue | null>(null);

/** 알림 버튼의 상태: 보여 줌 → (누름) 묻는 중 → 켜짐 / 거절됨 */
type ReminderAsk = 'offer' | 'asking' | 'enabled' | 'declined';

type Celebration = {
  state: StreakState;
  /** 알림이 이미 켜져 있으면 null — 버튼을 보여 주지 않는다 */
  reminder: StreakReminderSettings | null;
  /** 한 번만 실행되도록 감싼 원래의 이동 */
  next: () => void;
};

/**
 * 그날 첫 운동을 마치고 결과 화면을 떠날 때 한 번 축하 화면을 띄운다 (스펙 4.2).
 * 내비게이션 위에 떠야 해서 App 에서 AppNavigation 을 감싼다.
 * 축하 화면은 덤이다 — 무슨 일이 있어도 원래 가려던 곳(next)으로는 정확히 한 번 간다.
 */
export function StreakCelebrationProvider({children}: {children: React.ReactNode}): React.JSX.Element {
  const queryClient = useQueryClient();
  const dates = useWorkoutDates();
  // 사라지는 동안에도 내용이 보이도록 내용(celebration)과 표시 여부(visible)를 나눈다
  const [celebration, setCelebration] = useState<Celebration | null>(null);
  const [visible, setVisible] = useState(false);
  const [reminderAsk, setReminderAsk] = useState<ReminderAsk>('offer');

  // celebrateThen 을 안정적으로 두려고 최신 날짜 목록은 ref 로 읽는다
  const datesRef = useRef(dates);
  useEffect(() => {
    datesRef.current = dates;
  }, [dates]);

  // 결과 화면 버튼을 연달아 누르면 축하 화면이 두 번 뜨거나 이동이 겹친다 → 진행 중이면 무시한다
  const inFlight = useRef(false);

  const celebrateThen = useCallback(
    (next: () => void) => {
      if (inFlight.current) {
        return;
      }
      inFlight.current = true;
      let ran = false;
      const runNext = () => {
        if (ran) {
          return;
        }
        ran = true;
        inFlight.current = false;
        next();
      };

      const prepare = async () => {
        const known = datesRef.current;
        // 스트릭 정보를 못 불러왔으면 축하 화면을 건너뛴다
        if (known === null) {
          runNext();
          return;
        }
        const today = formatKSTDate(new Date());
        if ((await loadLastCelebrated()) === today) {
          runNext();
          return;
        }
        // 방금 한 운동이 아직 날짜 목록에 안 들어왔을 수 있어 오늘을 더해 계산한다 (중복은 무시된다)
        const state = computeStreak([...known, today], today);
        let reminder: StreakReminderSettings | null = null;
        try {
          const settings = await queryClient.ensureQueryData({
            queryKey: queryKeys.streak.reminder,
            queryFn: loadStreakReminder,
          });
          reminder = settings.enabled ? null : settings;
        } catch (error) {
          // 설정을 모르면 버튼만 뺀다
          console.warn('스트릭 알림 설정 읽기 실패:', error);
        }
        try {
          await saveLastCelebrated(today);
        } catch (error) {
          // 저장을 못 해도 오늘 축하는 보여 준다 (다음 운동 뒤 한 번 더 뜰 수 있을 뿐이다)
          console.warn('축하 날짜 저장 실패:', error);
        }
        setReminderAsk('offer');
        setCelebration({state, reminder, next: runNext});
        setVisible(true);
      };

      prepare().catch(error => {
        console.warn('축하 화면 준비 실패:', error);
        runNext();
      });
    },
    [queryClient],
  );

  const handleContinue = () => {
    if (!celebration || !visible) {
      return;
    }
    setVisible(false);
    celebration.next(); // 한 번만 실행되도록 감싸 두어 연타해도 두 번 이동하지 않는다
  };

  const handleEnableReminder = async () => {
    const settings = celebration?.reminder;
    if (!settings || reminderAsk !== 'offer') {
      return;
    }
    setReminderAsk('asking');
    let granted = false;
    try {
      granted = await requestNotificationPermission();
    } catch (error) {
      console.warn('알림 권한 요청 실패:', error);
    }
    if (!granted) {
      // 다시 조르지 않는다. 스트릭 화면에서 켤 수 있다고만 알린다
      setReminderAsk('declined');
      return;
    }
    const saved = {...settings, enabled: true};
    // 바로 알림 계획에 반영되도록 캐시부터 바꾸고, 저장에 실패하면 폰에 남은 값으로 되돌린다
    queryClient.setQueryData(queryKeys.streak.reminder, saved);
    try {
      await saveStreakReminder(saved);
    } catch (error) {
      console.error('스트릭 알림 설정 저장 실패:', error);
      queryClient.invalidateQueries({queryKey: queryKeys.streak.reminder});
    }
    setReminderAsk('enabled');
  };

  const value = useMemo(() => ({celebrateThen}), [celebrateThen]);

  return (
    <CelebrationContext.Provider value={value}>
      {children}
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={handleContinue}>
        {celebration && (
          <CelebrationContent
            celebration={celebration}
            reminderAsk={reminderAsk}
            onEnableReminder={handleEnableReminder}
            onContinue={handleContinue}
          />
        )}
      </Modal>
    </CelebrationContext.Provider>
  );
}

interface CelebrationContentProps {
  celebration: Celebration;
  reminderAsk: ReminderAsk;
  onEnableReminder: () => void;
  onContinue: () => void;
}

function CelebrationContent({
  celebration,
  reminderAsk,
  onEnableReminder,
  onContinue,
}: CelebrationContentProps) {
  const {state, reminder} = celebration;
  const {title, lines} = celebrationCopy(state);

  const renderReminder = () => {
    if (!reminder) {
      return null;
    }
    if (reminderAsk === 'enabled') {
      return <Text style={styles.reminderNote}>스트릭 알림을 켰어요</Text>;
    }
    if (reminderAsk === 'declined') {
      return <Text style={styles.reminderNote}>알림은 스트릭 화면에서 언제든 켤 수 있어요</Text>;
    }
    return (
      <Pressable
        onPress={onEnableReminder}
        disabled={reminderAsk === 'asking'}
        accessibilityRole="button"
        style={({pressed}) => [styles.reminderButton, pressed && styles.pressed]}>
        <FontAwesome6 name="bell" size={14} color={colors.primaryLight} iconStyle="solid" />
        <Text style={styles.reminderText}>스트릭 알림 받기</Text>
      </Pressable>
    );
  };

  return (
    <View style={styles.overlay}>
      <View style={styles.card}>
        <FontAwesome6 name="fire" size={64} color={colors.primary} iconStyle="solid" />
        <Text style={styles.title}>{title}</Text>
        <View style={styles.week}>
          <WeekDots week={state.week} />
        </View>
        <View style={styles.lines}>
          {lines.map(line => (
            <Text key={line} style={styles.line}>
              {line}
            </Text>
          ))}
        </View>
        <View style={styles.footer}>
          {renderReminder()}
          <CustomButton title="계속" onPress={onContinue} />
        </View>
      </View>
    </View>
  );
}

/** 결과 화면을 떠나는 지점에서 원래의 이동을 감싼다. StreakCelebrationProvider 안에서만 쓴다 */
export const useStreakCelebration = (): CelebrationContextValue => {
  const value = useContext(CelebrationContext);
  if (!value) {
    throw new Error('useStreakCelebration 은 StreakCelebrationProvider 안에서만 쓸 수 있어요');
  }
  return value;
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: colors.backgroundDark,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    paddingHorizontal: 24,
    paddingTop: 36,
    paddingBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.textLight,
    marginTop: 16,
  },
  week: {width: '100%', marginTop: 28},
  lines: {marginTop: 24, gap: 4, alignItems: 'center'},
  line: {fontSize: 16, lineHeight: 24, color: colors.gray400, textAlign: 'center'},
  footer: {width: '100%', marginTop: 28, gap: 12, alignItems: 'center'},
  reminderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: colors.primaryOverlay,
  },
  pressed: {backgroundColor: colors.primaryOverlayMedium},
  reminderText: {fontSize: 15, fontWeight: '600', color: colors.primaryLight},
  reminderNote: {fontSize: 14, color: colors.gray400, textAlign: 'center'},
});
