import React, {useEffect, useRef, useState} from 'react';
import {AppState, ScrollView, StatusBar, StyleSheet, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {RouteProp, useRoute} from '@react-navigation/native';
import {useQuery} from '@tanstack/react-query';
import {Button} from '../components/ui/Button';
import {Icon} from '../components/ui/Icon';
import {Text} from '../components/ui/Text';
import ChallengeResult from '../components/features/push-up/ChallengeResult';
import ProgramTestResult from '../components/features/program/ProgramTestResult';
import Count from '../components/features/push-up/Count';
import TimerContainer from '../components/features/push-up/TimerContainer';
import WorkoutHeader from '../components/features/workout/WorkoutHeader';
import {WorkoutAction} from '../components/features/workout/WorkoutAction';
import {
  WorkoutMilestone,
  useWorkoutMilestone,
} from '../components/features/workout/WorkoutMilestone';
import {useWorkoutCounter} from '../components/features/workout/useWorkoutCounter';
import {COUNTDOWN_SECONDS} from '../domain/workoutSession';
import {testThreshold} from '../domain/hundredPushups';
import {WEEKS} from '../constants/hundredPushups';
import {useKeepAwakeWhile} from '../hooks/useKeepAwakeWhile';
import useInterval from '../hooks/useInterval';
import {useSession} from '../hooks/useSession';
import {AppStackParamList} from '../navigations/AppNavigation';
import {getBestSetBefore} from '../remote/workoutHistory';
import {toProgramState} from '../remote/program';
import {currentProgramQueryOptions} from '../tanstack-query';
import {queryKeys} from '../tanstack-query/queryKeys';
import {color, layout, radius, space} from '../theme';
import {formatTime} from '../utils/time';

function ChallengeScreen(): React.JSX.Element {
  const route = useRoute<RouteProp<AppStackParamList, 'Challenge'>>();
  const isProgramTest = route.params?.purpose === 'program-test';
  const {user} = useSession();
  const manager = useWorkoutCounter();
  const {
    pushUpCount,
    isTracking,
    isPaused,
    timer: {elapsedTime},
    start,
    pause,
    resume,
    stop,
  } = manager;

  const [isFinished, setIsFinished] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [starting, setStarting] = useState(false);
  const {milestone, showMilestone} = useWorkoutMilestone();
  // 도전을 시작한 시각. 운동 중 최고 기록과 결과 화면의 지난번·최고 기록은 이보다 앞선 기록과 비교한다
  const startedAt = useRef(new Date().toISOString()).current;
  const lastCount = useRef(0);
  const mode = isProgramTest ? 'program_test' : 'challenge';
  const {data: best} = useQuery({
    queryKey: [
      ...queryKeys.pushup.all,
      'bestSetBefore',
      user?.id,
      startedAt,
      mode,
    ],
    queryFn: () => getBestSetBefore(startedAt, mode),
    enabled: !!user?.id,
  });
  const {data: programRow} = useQuery({
    ...currentProgramQueryOptions(user?.id ?? ''),
    enabled: isProgramTest && !!user?.id,
  });
  const program = programRow ? toProgramState(programRow) : null;
  const testWeek = isProgramTest && program?.testDue ? program.week : null;
  const threshold = testWeek === null ? null : testThreshold(testWeek);
  const tracking = isTracking && !isPaused;
  useKeepAwakeWhile(!isFinished && (countdown > 0 || starting || isTracking));

  useInterval(
    () => {
      if (AppState.currentState === 'background') {
        setCountdown(0);
      } else if (countdown > 1) {
        setCountdown(countdown - 1);
      } else {
        setCountdown(0);
        setStarting(true);
        start().finally(() => setStarting(false));
      }
    },
    countdown > 0 ? 1000 : null,
  );

  useEffect(() => {
    const subscription = AppState.addEventListener('change', next => {
      if (next === 'background') {
        setCountdown(0);
        pause();
      }
    });
    return () => subscription.remove();
  }, [pause]);

  useEffect(() => {
    const previous = lastCount.current;
    lastCount.current = pushUpCount;
    if (tracking && best != null && previous <= best && pushUpCount > best) {
      showMilestone({reps: pushUpCount, previousBest: best});
    }
  }, [best, pushUpCount, showMilestone, tracking]);

  if (isFinished) {
    return isProgramTest ? (
      <ProgramTestResult
        reps={pushUpCount}
        duration={elapsedTime}
        beforeIso={startedAt}
      />
    ) : (
      <ChallengeResult
        pushUpCount={pushUpCount}
        duration={elapsedTime}
        beforeIso={startedAt}
      />
    );
  }

  const finish = () => {
    stop();
    setIsFinished(true);
  };
  const title =
    testWeek !== null
      ? `${testWeek}주차 테스트`
      : isProgramTest
      ? '최대 횟수 테스트'
      : '한 번에 몇 개?';
  const guidance =
    threshold !== null
      ? testWeek === WEEKS
        ? `${threshold}개면 완주`
        : `${threshold}개면 ${(testWeek ?? 0) + 1}주차로`
      : best != null && best > pushUpCount
      ? `최고 ${best}까지 ${best - pushUpCount}개`
      : '가능한 만큼';
  const progressTarget = threshold ?? best;
  const progressLabel =
    threshold !== null
      ? `기준 ${threshold}개 · ${Math.max(0, threshold - pushUpCount)}개 남음`
      : best != null
      ? `최고 기록 ${best}개`
      : '운동 시간';

  return (
    <SafeAreaView style={[styles.safeArea, tracking && styles.tracking]}>
      <StatusBar barStyle={milestone ? 'dark-content' : 'light-content'} />
      <ScrollView bounces={false} contentContainerStyle={styles.container}>
        <WorkoutHeader
          phase={
            tracking
              ? 'tracking'
              : isPaused
              ? 'paused'
              : countdown
              ? 'countdown'
              : 'idle'
          }
          title={title}
        />
        <View style={styles.hero}>
          {isPaused ? (
            <>
              <View style={styles.pauseIcon}>
                <Icon name="pause" color="active" size={28} />
              </View>
              <Text variant="title">멈췄어요</Text>
              <Text color="textMuted">{pushUpCount}개 저장됨</Text>
            </>
          ) : (
            <>
              {(tracking || countdown > 0) && (
                <Count
                  value={tracking ? pushUpCount : countdown}
                  color={tracking ? 'onBrand' : 'text'}
                  pulse={tracking}
                />
              )}
              <Text
                color={tracking ? 'onBrand' : 'text'}
                weight={800}
                style={styles.heroLabel}>
                {tracking ? guidance : '엎드려 주세요'}
              </Text>
              {!tracking && countdown === 0 && (
                <Text color="textMuted" style={styles.centered}>
                  기기를 얼굴과 마주보게 바닥에 두세요
                </Text>
              )}
            </>
          )}
        </View>
        {tracking ? (
          <View style={styles.trackingFooter}>
            <TimerContainer
              label={progressLabel}
              detail={formatTime(elapsedTime).replace(/^0/, '')}
              progress={
                progressTarget ? pushUpCount / progressTarget : undefined
              }
            />
            <View style={styles.actions}>
              <WorkoutAction
                title="끝내기"
                icon="square"
                variant="tracking"
                onPress={finish}
              />
              <WorkoutAction
                title="잠깐 멈추기"
                icon="pause"
                variant="tracking"
                iconOnly
                onPress={pause}
              />
            </View>
          </View>
        ) : isPaused ? (
          <View style={styles.footer}>
            <Button
              title="이어서 하기"
              icon="play"
              variant="primary"
              onPress={resume}
            />
            <Button title="끝내기" variant="secondary" onPress={finish} />
          </View>
        ) : countdown > 0 ? (
          <Button
            title="준비로 돌아가기"
            icon="x"
            variant="secondary"
            onPress={() => setCountdown(0)}
          />
        ) : (
          <Button
            title="시작"
            icon="play"
            variant="primary"
            loading={starting}
            onPress={() => setCountdown(COUNTDOWN_SECONDS)}
          />
        )}
      </ScrollView>
      {milestone && <WorkoutMilestone milestone={milestone} />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {flex: 1, backgroundColor: color.bg},
  tracking: {backgroundColor: color.activeFill},
  container: {
    flexGrow: 1,
    paddingHorizontal: layout.screenPadding,
    paddingVertical: space[12],
    gap: space[8],
  },
  hero: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: space[12],
    gap: space[8],
  },
  heroLabel: {fontSize: 44, lineHeight: 54, textAlign: 'center'},
  centered: {textAlign: 'center'},
  pauseIcon: {
    padding: space[16],
    borderRadius: radius.pill,
    backgroundColor: color.activeTint,
  },
  footer: {gap: space[12]},
  trackingFooter: {
    backgroundColor: `${color.bg}24`,
    marginHorizontal: -layout.screenPadding,
    paddingHorizontal: layout.screenPadding,
    paddingVertical: space[12],
    gap: space[12],
  },
  actions: {flexDirection: 'row', gap: space[12]},
});

export default ChallengeScreen;
