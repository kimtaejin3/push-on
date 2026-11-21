import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {Platform, StyleSheet, View} from 'react-native';
import {useQueryClient} from '@tanstack/react-query';
import {computeStreak, type StreakState} from '../../../domain/streak';
import {celebrationCopy} from '../../../domain/streakMessages';
import type {StreakReminderSettings} from '../../../domain/streakNotifications';
import {useWorkoutDates} from '../../../hooks/useStreak';
import {requestNotificationPermission} from '../../../services/workoutReminder';
import {queryKeys} from '../../../tanstack-query/queryKeys';
import {space} from '../../../theme';
import {
  loadLastCelebrated,
  loadReminderOffered,
  loadStreakReminder,
  saveLastCelebrated,
  saveReminderOffered,
  saveStreakReminder,
} from '../../../utils/streakStorage';
import {formatKSTDate} from '../../../utils/time';
import {withTimeout} from '../../../utils/withTimeout';
import {Button, Icon, Text} from '../../ui';
import {BottomSheet} from '../../ui/feedback/BottomSheet';
import WeekDots from './WeekDots';

type CelebrationContextValue = {celebrateThen: (next: () => void) => void};

/** 축하 화면 준비(폰 저장소 읽기)를 기다리는 최대 시간 */
const PREPARE_TIMEOUT_MS = 1500;

const CelebrationContext = createContext<CelebrationContextValue | null>(null);

/** 알림 버튼의 상태: 보여 줌 → (누름) 묻는 중 → 켜짐 / 거절됨 */
type ReminderAsk = 'offer' | 'asking' | 'enabled' | 'declined';

type Celebration = {
  state: StreakState;
  /** 알림이 이미 켜져 있거나 예전에 권했으면 null — 버튼을 보여 주지 않는다 */
  reminder: StreakReminderSettings | null;
  /** 한 번만 실행되도록 감싼 원래의 이동 */
  next: () => void;
};

/** 축하 화면을 띄우는 데 필요한 것 (읽기 결과) */
type Prepared = Pick<Celebration, 'state' | 'reminder'> & {today: string};

/**
 * 그날 첫 운동을 마치고 결과 화면을 떠날 때 한 번 축하 화면을 띄운다 (스펙 4.2).
 * 내비게이션 위에 떠야 해서 App 에서 AppNavigation 을 감싼다.
 * 축하 화면은 덤이다 — 무슨 일이 있어도 원래 가려던 곳(next)으로는 정확히 한 번 간다.
 */
export function StreakCelebrationProvider({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
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
        // 일부러 버린다: 결과 화면 버튼 연타 방지. 이동은 먼저 들어온 호출의 next 가 한다
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

      // 읽기만 한다. 저장은 실제로 띄울 때 한다 — 시간이 초과된 뒤 늦게 끝나도 흔적을 남기지 않게
      const prepare = async (): Promise<Prepared | null> => {
        const known = datesRef.current;
        // 스트릭 정보를 못 불러왔으면 축하 화면을 건너뛴다
        if (known === null) {
          return null;
        }
        const today = formatKSTDate(new Date());
        if ((await loadLastCelebrated()) === today) {
          return null;
        }
        // 방금 한 운동이 아직 날짜 목록에 안 들어왔을 수 있어 오늘을 더해 계산한다 (중복은 무시된다)
        const state = computeStreak([...known, today], today);
        let reminder: StreakReminderSettings | null = null;
        try {
          const settings = await queryClient.ensureQueryData({
            queryKey: queryKeys.streak.reminder,
            queryFn: loadStreakReminder,
          });
          // 알림 권유는 첫 축하 화면에서 한 번만 (거절해도 다시 조르지 않는다. 스트릭 화면에서 켤 수 있다)
          if (!settings.enabled && !(await loadReminderOffered())) {
            reminder = settings;
          }
        } catch (error) {
          // 설정을 모르면 버튼만 뺀다
          console.warn('스트릭 알림 설정 읽기 실패:', error);
        }
        return {today, state, reminder};
      };

      // 폰 저장소가 멈춰도 결과 화면에 갇히지 않게, 준비가 늦으면 축하 화면 없이 이동한다
      withTimeout(prepare(), PREPARE_TIMEOUT_MS)
        .then(prepared => {
          if (!prepared) {
            runNext();
            return;
          }
          const {today, state, reminder} = prepared;
          // 저장을 못 해도 오늘 축하는 보여 준다 (다음 운동 뒤 한 번 더 뜰 수 있을 뿐이다)
          saveLastCelebrated(today).catch(error =>
            console.warn('축하 날짜 저장 실패:', error),
          );
          if (reminder) {
            // 누르든 안 누르든 보여 준 것으로 친다
            saveReminderOffered().catch(error =>
              console.warn('알림 권유 기록 실패:', error),
            );
          }
          setReminderAsk('offer');
          setCelebration({state, reminder, next: runNext});
          setVisible(true);
        })
        .catch(error => {
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
    // iOS 에서는 축하 모달이 닫혀야 추적 안내 모달을 열 수 있다
    if (Platform.OS !== 'ios') {
      celebration.next();
    }
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
      <BottomSheet
        visible={visible}
        onClose={handleContinue}
        onDismiss={celebration?.next}>
        {celebration && (
          <CelebrationContent
            celebration={celebration}
            reminderAsk={reminderAsk}
            onEnableReminder={handleEnableReminder}
            onContinue={handleContinue}
          />
        )}
      </BottomSheet>
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

  const [before, count, after] = title.split(/(\d+)/);
  const accent = state.milestoneToday === null ? 'active' : 'record';

  const renderReminder = () => {
    if (!reminder) {
      return null;
    }
    if (reminderAsk === 'enabled' || reminderAsk === 'declined') {
      return (
        <Text variant="label" color="textMuted" style={styles.centered}>
          {reminderAsk === 'enabled'
            ? '스트릭 알림을 켰어요'
            : '알림은 스트릭 화면에서 언제든 켤 수 있어요'}
        </Text>
      );
    }
    return (
      <Button
        variant="secondary"
        title="스트릭 알림 받기"
        icon="bell"
        loading={reminderAsk === 'asking'}
        onPress={onEnableReminder}
      />
    );
  };

  return (
    <View style={styles.content}>
      <View style={styles.heading} accessibilityRole="header">
        <Icon
          name={state.milestoneToday === null ? 'zap' : 'trophy'}
          size={36}
          color={accent}
        />
        <Text variant="title" style={styles.centered}>
          {before}
          <Text variant="title" numeric color={accent}>
            {count}
          </Text>
          {after}
        </Text>
      </View>
      <WeekDots week={state.week} />
      <View>
        {lines.map(line => (
          <Text key={line} color="textMuted" style={styles.centered}>
            {line}
          </Text>
        ))}
      </View>
      <View style={styles.actions}>
        {renderReminder()}
        <Button variant="primary" title="계속" onPress={onContinue} />
      </View>
    </View>
  );
}

/** 결과 화면을 떠나는 지점에서 원래의 이동을 감싼다. StreakCelebrationProvider 안에서만 쓴다 */
export const useStreakCelebration = (): CelebrationContextValue => {
  const value = useContext(CelebrationContext);
  if (!value) {
    throw new Error(
      'useStreakCelebration 은 StreakCelebrationProvider 안에서만 쓸 수 있어요',
    );
  }
  return value;
};

const styles = StyleSheet.create({
  content: {gap: space[24]},
  heading: {alignItems: 'center', gap: space[12]},
  centered: {textAlign: 'center'},
  actions: {gap: space[8]},
});
