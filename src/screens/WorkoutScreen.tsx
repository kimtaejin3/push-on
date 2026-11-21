import React, {useEffect, useLayoutEffect, useRef, useState} from 'react';
import {
  ActivityIndicator,
  AppState,
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {
  NavigationAction,
  RouteProp,
  StackActions,
  useNavigation,
  usePreventRemove,
  useRoute,
} from '@react-navigation/native';
import {useQuery, useQueryClient} from '@tanstack/react-query';
import {useWorkoutCounter} from '../components/features/workout/useWorkoutCounter';
import {useKeepAwakeWhile} from '../hooks/useKeepAwakeWhile';
import {useWorkoutSession} from '../hooks/useWorkoutSession';
import {useSession} from '../hooks/useSession';
import {Button} from '../components/ui/Button';
import {Icon} from '../components/ui/Icon';
import {Text} from '../components/ui/Text';
import {ConfirmDialog} from '../components/ui/feedback/ConfirmDialog';
import {WorkoutAction} from '../components/features/workout/WorkoutAction';
import {
  WorkoutMilestone,
  useWorkoutMilestone,
} from '../components/features/workout/WorkoutMilestone';
import Count from '../components/features/push-up/Count';
import TimerContainer from '../components/features/push-up/TimerContainer';
import WorkoutHeader from '../components/features/workout/WorkoutHeader';
import RestTimer from '../components/features/workout/RestTimer';
import WorkoutSummary from '../components/features/workout/WorkoutSummary';
import ProgramDaySummary from '../components/features/program/ProgramDaySummary';
import {color, layout, radius, space} from '../theme';
import {formatTime} from '../utils/time';
import {generateUuid} from '../utils/id';
import {saveWorkout} from '../remote/pushup';
import {getBestSetBefore} from '../remote/workoutHistory';
import {loadWorkoutPrefs, WorkoutPrefs} from '../utils/workoutPrefs';
import {ProgramRow, toProgramState} from '../remote/program';
import {
  attemptRecord,
  completeDay,
  downgradeTarget,
  failStreak,
  missedSets,
  moveRecord,
  moveTo,
  planMatches,
  Position,
} from '../domain/hundredPushups';
import {
  downgradeNotice,
  nextStepLabel,
  withJosa,
} from '../domain/programMessages';
import {
  shouldConfirmLeave,
  REST_EXTEND_SECONDS,
} from '../domain/workoutSession';
import {AppStackParamList} from '../navigations/AppNavigation';
import {
  currentProgramQueryOptions,
  useUpdateProgramMutation,
} from '../tanstack-query';
import {queryKeys} from '../tanstack-query/queryKeys';
import {useStreakCelebration} from '../components/features/streak/StreakCelebrationProvider';

/** 프로그램 운동 한 번의 판정 결과. 운동이 끝난 순간의 상태로 한 번만 정한다 */
type DayOutcome = {
  position: Position;
  passed: boolean;
  /** 이번 시도를 포함한 연속 실패 횟수 */
  streak: number;
  nextLabel: string;
  downgrade: Position | null;
};

/**
 * 세트 모드 / 100개 프로그램 공용 운동 화면.
 * 상태기계(useWorkoutSession)가 흐름을, usePushUpManager 가 실제 카운팅을 맡는다.
 */
function WorkoutScreen(): React.JSX.Element {
  const {data, isFetching} = useQuery({
    queryKey: queryKeys.workoutPrefs,
    queryFn: loadWorkoutPrefs,
    networkMode: 'always',
  });
  const [initialPrefs, setInitialPrefs] = useState<WorkoutPrefs>();
  useEffect(() => {
    if (!initialPrefs && !isFetching && data) {
      setInitialPrefs(data);
    }
  }, [data, initialPrefs, isFetching]);

  return initialPrefs ? (
    <Workout prefs={initialPrefs} />
  ) : (
    <SafeAreaView style={[styles.safeArea, styles.pending]}>
      <ActivityIndicator
        color={color.active}
        accessibilityLabel="운동 설정을 불러오고 있어요"
      />
    </SafeAreaView>
  );
}

function Workout({prefs}: {prefs: WorkoutPrefs}): React.JSX.Element {
  const navigation = useNavigation();
  const {params} = useRoute<RouteProp<AppStackParamList, 'Workout'>>();
  const {plan, source} = params;
  const isProgram = source.kind === 'program';
  const {user} = useSession();
  const queryClient = useQueryClient();

  const manager = useWorkoutCounter();
  const {
    state,
    target,
    start,
    beginCountdown,
    pause,
    resume,
    count,
    finishSet,
    skipRest,
    extendRest,
  } = useWorkoutSession(plan, {autoNext: prefs.autoNextSet});
  const {phase} = state;
  const {milestone, showMilestone} = useWorkoutMilestone();
  const [leaveAction, setLeaveAction] = useState<NavigationAction | null>(null);
  const [restDuration, setRestDuration] = useState(plan.restSeconds);
  // 운동을 시작한 시각 (첫 세트 저장 전). 운동 중 최고 기록과 결과 화면의 지난번·한 세트 최고는
  // 이보다 앞선 기록과 비교한다 — 끝난 시각을 쓰면 세트마다 저장한 이번 운동이 자기 자신과 비교된다
  const startedAt = useRef(new Date().toISOString()).current;
  const {data: previousBest} = useQuery({
    queryKey: [...queryKeys.pushup.all, 'bestSetBefore', user?.id, startedAt],
    queryFn: () => getBestSetBefore(startedAt),
    enabled: !!user?.id,
  });
  useKeepAwakeWhile(phase !== 'idle' && phase !== 'done');

  const workoutId = useRef(generateUuid()).current;
  const totalSeconds = useRef(0);
  const savedCount = useRef(0);
  // queued: 폰에 보관했고 연결되면 다시 보낸다 / failed: 보관도 못 했다 (로그인 안 됨)
  const [saveError, setSaveError] = useState<'queued' | 'failed' | null>(null);

  const programQuery = useQuery({
    ...currentProgramQueryOptions(user?.id ?? ''),
    enabled: isProgram && !!user?.id,
  });
  const programRow = programQuery.data;
  // 운동 결과 기록과 하향은 저장 상태를 따로 보여줘야 해서 뮤테이션을 나눈다
  const recordMutation = useUpdateProgramMutation();
  const moveMutation = useUpdateProgramMutation();

  const {
    stop: stopCounter,
    pause: pauseCounter,
    resume: resumeCounter,
    start: startCounter,
  } = manager;
  const elapsed = manager.timer.elapsedTime;
  const previousPhase = useRef(phase);

  useLayoutEffect(() => {
    const previous = previousPhase.current;
    previousPhase.current = phase;
    if (phase === previous) {
      return;
    }
    if (phase === 'tracking') {
      if (AppState.currentState === 'background') {
        pause();
      } else if (previous === 'paused') {
        resumeCounter();
      } else {
        startCounter();
      }
    } else if (phase === 'paused') {
      pauseCounter();
    } else if (previous === 'tracking' || previous === 'paused') {
      stopCounter();
    }
  }, [phase, pause, pauseCounter, resumeCounter, startCounter, stopCounter]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', next => {
      if (next === 'background') {
        pauseCounter();
        pause();
      }
    });
    return () => subscription.remove();
  }, [pause, pauseCounter]);

  useEffect(() => {
    const reps = manager.pushUpCount;
    if (
      phase !== 'tracking' ||
      !manager.isTracking ||
      manager.isPaused ||
      reps <= state.currentCount
    ) {
      return;
    }
    const best =
      previousBest === undefined || previousBest === null
        ? undefined
        : Math.max(previousBest, ...state.results);
    const record =
      best !== undefined && state.currentCount <= best && reps > best;
    const goal = state.currentCount < target.reps && reps >= target.reps;
    if (record || goal) {
      showMilestone({
        reps,
        previousBest: record ? best : undefined,
        goal: goal ? target.reps : undefined,
        autoFinish:
          goal && !target.isMax && state.setIndex + 1 < plan.sets.length,
      });
    }
    count(reps);
  }, [
    count,
    manager.isPaused,
    manager.isTracking,
    manager.pushUpCount,
    phase,
    plan.sets.length,
    previousBest,
    showMilestone,
    state.currentCount,
    state.results,
    state.setIndex,
    target.isMax,
    target.reps,
  ]);

  const setSeconds = manager.isTracking ? elapsed : 0;
  const summarySeconds =
    totalSeconds.current +
    (state.results.length > savedCount.current ? setSeconds : 0);

  // 저장은 세트가 끝났을 때 한 번만 시도한다.
  useEffect(() => {
    if (state.results.length === savedCount.current) {
      return;
    }
    savedCount.current = state.results.length;
    const index = state.results.length - 1;
    const reps = state.results[index];
    totalSeconds.current += setSeconds;
    setRestDuration(plan.restSeconds);
    if (reps > 0) {
      // 네트워크가 끊겨도 보관된 세트는 연결되면 다시 보낸다.
      saveWorkout({
        reps,
        duration_seconds: setSeconds,
        mode: isProgram ? 'program' : 'sets',
        workout_id: workoutId,
        set_index: index + 1,
        target_reps: plan.sets[index],
      })
        .then(result => {
          if (result === 'queued') {
            setSaveError(prev => prev ?? 'queued');
          }
          queryClient.invalidateQueries({queryKey: queryKeys.pushup.all});
        })
        .catch(() => setSaveError('failed'));
    }
  }, [
    state.results,
    setSeconds,
    plan.restSeconds,
    plan.sets,
    isProgram,
    workoutId,
    queryClient,
  ]);

  // 프로그램: 운동을 끝까지 마치면 시도 1건을 기록한다.
  // 모든 세트를 채웠을 때만 다음 Day 로 넘어가고, 못 채웠으면 위치는 그대로 둔다.
  // 한 운동에 기록은 1건 — 재시도는 같은 내용을 다시 보낸다 (기록을 새로 만들지 않는다).
  const [outcome, setOutcome] = useState<DayOutcome | null>(null);
  // 운동하는 사이에 프로그램이 없어졌거나 위치가 바뀌어, 이 결과를 진행에 반영할 수 없는 경우
  const [unrecordable, setUnrecordable] = useState(false);
  const recorded = useRef(false);
  const {mutate: saveRecord} = recordMutation;
  // undefined = 아직 모름, null = 프로그램 없음이 확인됨 (재조회 실패여도 캐시된 값이 있으면 그걸 쓴다)
  const programLoaded = programQuery.data !== undefined;
  useEffect(() => {
    if (state.phase !== 'done' || !isProgram || !programLoaded || recorded.current) {
      return;
    }
    recorded.current = true;
    const current = programRow ? toProgramState(programRow) : null;
    // 방금 한 세트가 지금 위치의 세트가 아니면 기록하지 않는다 (다른 Day 를 통과 처리하면 안 된다)
    if (!programRow || !current || !planMatches(current, plan.sets)) {
      setUnrecordable(true);
      return;
    }
    const record = attemptRecord(current, plan.sets, state.results, new Date().toISOString());
    const passed = record.passed === true;
    setOutcome({
      position: {week: current.week, day: current.day, level: current.level},
      passed,
      streak: passed ? 0 : failStreak([...programRow.completed_days, record], current),
      nextLabel: nextStepLabel(current),
      downgrade: passed ? null : downgradeTarget(current),
    });
    saveRecord({
      id: programRow.id,
      state: passed ? completeDay(current) : current,
      completedDay: record,
      existing: programRow.completed_days,
    });
  }, [state.phase, state.results, isProgram, programLoaded, programRow, plan.sets, saveRecord]);

  const retrySave = () => {
    if (recordMutation.variables) {
      recordMutation.mutate(recordMutation.variables);
    } else {
      programQuery.refetch();
    }
  };

  // 버튼과 시스템 뒤로가기는 같은 확인창을 사용한다.
  usePreventRemove(shouldConfirmLeave(state), ({data}) => {
    setLeaveAction(data.action);
  });

  // navigate 는 기존 화면으로 돌아가지 않고 새로 쌓으므로(React Navigation 7) popTo 로 돌아간다
  const goBackToStart = (notice?: string) =>
    navigation.dispatch(
      isProgram
        ? StackActions.popTo('Tabs', {screen: 'Program', params: {notice}})
        : StackActions.popTo('Tabs'),
    );

  // 운동을 마친 요약 화면을 떠날 때: 1개라도 했으면 그날 첫 운동일 때 축하 화면을 거친다.
  // 운동 중 그만두기(usePreventRemove)·반영 못 한 화면은 이걸 거치지 않는다
  const {celebrateThen} = useStreakCelebration();
  const didAny = state.results.some(reps => reps > 0);
  // [기록에서 보기]는 같은 순서로 기록 탭에 간다
  const leaveSummary = (notice?: string, to?: 'History') => {
    const go = () =>
      to
        ? navigation.dispatch(StackActions.popTo('Tabs', {screen: to}))
        : goBackToStart(notice);
    if (didAny) {
      celebrateThen(go);
    } else {
      go();
    }
  };

  const handleDowngrade = () => {
    // 방금 저장한 기록이 들어 있는 최신 행을 캐시에서 읽는다 (낡은 completed_days 로 덮어쓰지 않도록)
    const row = queryClient.getQueryData<ProgramRow | null>(queryKeys.program.current);
    if (!row || !outcome?.downgrade) {
      return;
    }
    const from = outcome.position;
    const to = outcome.downgrade;
    const moved = moveTo(toProgramState(row), to);
    moveMutation.mutate(
      {
        id: row.id,
        state: moved,
        completedDay: moveRecord(moved, new Date().toISOString()),
        existing: row.completed_days,
      },
      {onSuccess: () => leaveSummary(downgradeNotice(from, to))},
    );
  };

  if (phase === 'done' && !milestone) {
    if (!isProgram) {
      return (
        <WorkoutSummary
          plan={plan}
          results={state.results}
          totalSeconds={summarySeconds}
          beforeIso={startedAt}
          setSaveStatus={saveError}
          onDone={() => leaveSummary()}
          onHistory={() => leaveSummary(undefined, 'History')}
        />
      );
    }
    if (unrecordable) {
      return (
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.pending}>
            <Text style={styles.centered}>
              운동하는 사이에 프로그램 진행 위치가 바뀌어서{'\n'}이번 운동은
              진행에 반영하지 않았어요.{'\n'}
              세트 기록은 히스토리에 그대로 남아 있어요.
            </Text>
            <Button
              title="프로그램으로"
              variant="primary"
              onPress={() => goBackToStart()}
            />
          </View>
        </SafeAreaView>
      );
    }
    if (!outcome) {
      // 프로그램 정보를 아직 못 받았다 — 받아야 판정·기록을 할 수 있다
      return (
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.pending}>
            {programQuery.isError ? (
              <>
                <Text style={styles.centered}>
                  프로그램 정보를 불러오지 못해 운동 결과를 반영하지 못했어요.
                  {'\n'}네트워크를 확인하고 다시 시도해 주세요.
                </Text>
                <Button
                  title="다시 시도"
                  variant="primary"
                  onPress={retrySave}
                />
              </>
            ) : (
              <>
                <ActivityIndicator size="large" color={color.active} />
                <Text style={styles.centered}>운동 결과를 반영하고 있어요</Text>
              </>
            )}
          </View>
        </SafeAreaView>
      );
    }
    return (
      <ProgramDaySummary
        position={outcome.position}
        targets={plan.sets}
        results={state.results}
        totalSeconds={summarySeconds}
        beforeIso={startedAt}
        setSaveStatus={saveError}
        passed={outcome.passed}
        streak={outcome.streak}
        nextLabel={outcome.nextLabel}
        downgrade={outcome.downgrade}
        save={{pending: recordMutation.isPending, error: recordMutation.isError, onRetry: retrySave}}
        move={{pending: moveMutation.isPending, error: moveMutation.isError}}
        onDone={() => leaveSummary()}
        onDowngrade={handleDowngrade}
        onHistory={() => leaveSummary(undefined, 'History')}
      />
    );
  }

  const renderRest = () => {
    const index = state.setIndex;
    const nextIndex = index + 1;
    const lastSetIndex = plan.sets.length - 1;
    // 못 채운 이유·다음 할 일은 이 운동에서 처음 못 채운 세트 직후에만 길게 알려준다
    const missed = missedSets(plan.sets.slice(0, state.results.length), state.results);
    const firstMiss = isProgram && missed.length === 1 && missed[0].set === index + 1;
    const current = programRow ? toProgramState(programRow) : null;
    const note = firstMiss
      ? current
        ? `오늘은 모든 세트를 채워야 다음(${nextStepLabel(current)})으로 넘어가요.\n이번엔 Day ${withJosa(current.day, '을')} 다시 하게 되지만, 남은 세트도 끝까지 하면 다음 도전이 쉬워져요.`
        : '오늘은 모든 세트를 채워야 다음으로 넘어가요.\n이번엔 같은 Day를 다시 하게 되지만, 남은 세트도 끝까지 하면 다음 도전이 쉬워져요.'
      : undefined;
    return (
      <RestTimer
        remaining={state.restRemaining}
        duration={restDuration}
        autoNext={state.autoNext}
        onSkip={() => {
          skipRest();
          start();
        }}
        onExtend={() => {
          setRestDuration(total => total + REST_EXTEND_SECONDS);
          extendRest();
        }}
        last={{
          setNumber: index + 1,
          reps: state.results[index] ?? 0,
          target: plan.sets[index],
          isMax: plan.lastIsMax && index === lastSetIndex,
        }}
        next={{
          reps: plan.sets[nextIndex],
          isMax: plan.lastIsMax && nextIndex === lastSetIndex,
        }}
        note={note}
      />
    );
  };

  const tracking = phase === 'tracking';
  const resting = phase === 'rest';
  const paused = phase === 'paused';
  const preparing = phase === 'idle' || phase === 'countdown';
  const set = {
    current: state.setIndex + 1,
    total: plan.sets.length,
    results: state.results,
  };
  const targetLabel = target.isMax
    ? `최소 ${target.reps}, 가능한 만큼`
    : `목표 ${target.reps}개`;
  const remaining = Math.max(0, target.reps - state.currentCount);
  const attemptLabel =
    target.isMax && remaining === 0
      ? `최소 ${target.reps}개 달성 · 더 해도 돼요`
      : `목표 ${target.reps}개 중 ${state.currentCount}개`;

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        tracking && styles.tracking,
        resting && styles.resting,
      ]}>
      <StatusBar
        barStyle={resting || milestone ? 'dark-content' : 'light-content'}
      />
      {phase !== 'done' && (
        <ScrollView contentContainerStyle={styles.container} bounces={false}>
          <WorkoutHeader phase={phase} set={set} />
          {saveError && (
            <Text
              color={tracking ? 'onBrand' : resting ? 'onAccent' : 'alert'}
              variant="caption">
              {saveError === 'queued'
                ? '저장이 지연되고 있어요. 연결되면 자동으로 다시 보내요'
                : '세트를 저장하지 못했어요. 로그인 상태를 확인해 주세요'}
            </Text>
          )}
          {resting ? (
            renderRest()
          ) : (
            <>
              <View style={styles.hero}>
                {paused ? (
                  <>
                    <View style={styles.pauseIcon}>
                      <Icon name="pause" color="active" size={28} />
                    </View>
                    <Text variant="title">멈췄어요</Text>
                    <Text color="textMuted">
                      {state.currentCount}개 저장됨 · 세트 {set.current} /{' '}
                      {set.total}
                    </Text>
                  </>
                ) : (
                  <>
                    {phase !== 'idle' && (
                      <Count
                        value={
                          tracking
                            ? state.currentCount
                            : state.countdownRemaining
                        }
                        color={tracking ? 'onBrand' : 'text'}
                        pulse={tracking}
                      />
                    )}
                    <Text
                      color={tracking ? 'onBrand' : 'text'}
                      weight={800}
                      style={
                        tracking && !target.isMax
                          ? styles.remaining
                          : styles.heroLabel
                      }>
                      {tracking
                        ? target.isMax
                          ? targetLabel
                          : `${remaining}개 남음`
                        : '엎드려 주세요'}
                    </Text>
                    {phase === 'idle' && (
                      <Text color="textMuted" style={styles.centered}>
                        기기를 얼굴과 마주보게 바닥에 두세요
                      </Text>
                    )}
                  </>
                )}
              </View>
              <View style={tracking ? styles.trackingFooter : styles.footer}>
                {tracking && (
                  <>
                    <TimerContainer
                      label={attemptLabel}
                      detail={formatTime(elapsed).replace(/^0/, '')}
                      progress={state.currentCount / Math.max(1, target.reps)}
                    />
                    <View style={styles.actions}>
                      <WorkoutAction
                        title="잠깐 멈추기"
                        icon="pause"
                        variant="tracking"
                        onPress={pause}
                      />
                      <WorkoutAction
                        title="운동 그만두기"
                        icon="square"
                        variant="tracking"
                        iconOnly
                        onPress={() => goBackToStart()}
                      />
                    </View>
                    {target.isMax && (
                      <Button
                        title="이 세트 끝내기"
                        variant="text"
                        onPress={finishSet}
                      />
                    )}
                  </>
                )}
                {paused && (
                  <>
                    <Button
                      title="이어서 하기"
                      variant="primary"
                      icon="play"
                      onPress={resume}
                    />
                    <Button
                      title="이 세트 끝내기"
                      variant="secondary"
                      onPress={finishSet}
                    />
                  </>
                )}
                {preparing && (
                  <Text variant="headline">
                    {set.current === 1 ? '첫 세트' : '다음 세트'} {targetLabel}
                  </Text>
                )}
                {phase === 'idle' && (
                  <Button
                    title="시작"
                    variant="primary"
                    icon="play"
                    onPress={beginCountdown}
                  />
                )}
                {phase === 'countdown' && (
                  <Button
                    title="취소하고 돌아가기"
                    icon="x"
                    variant="secondary"
                    onPress={() => goBackToStart()}
                  />
                )}
              </View>
            </>
          )}
          {phase !== 'countdown' && !tracking && (
            <Button
              title="운동 그만두기"
              variant="text"
              onPress={() => goBackToStart()}
            />
          )}
        </ScrollView>
      )}
      {milestone && <WorkoutMilestone milestone={milestone} />}
      <ConfirmDialog
        visible={leaveAction !== null}
        title="운동 그만두기"
        message={
          isProgram
            ? '지금까지 끝낸 세트는 기록에 남아요.\n오늘 운동은 처음부터 다시 해야 해요.'
            : '지금까지 끝낸 세트는 기록에 남아요.'
        }
        confirmLabel="그만두기"
        cancelLabel="취소"
        destructive
        onCancel={() => setLeaveAction(null)}
        onConfirm={() => {
          if (leaveAction) {
            setLeaveAction(null);
            stopCounter();
            navigation.dispatch(leaveAction);
          }
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {flex: 1, backgroundColor: color.bg},
  tracking: {backgroundColor: color.activeFill},
  resting: {backgroundColor: color.rest},
  container: {
    flexGrow: 1,
    paddingHorizontal: layout.screenPadding,
    paddingVertical: space[12],
    gap: space[8],
  },
  pending: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: space[24],
    gap: space[20],
  },
  centered: {textAlign: 'center'},
  hero: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: space[12],
    gap: space[8],
  },
  heroLabel: {fontSize: 44, lineHeight: 54, textAlign: 'center'},
  remaining: {fontSize: 52, lineHeight: 62, textAlign: 'center'},
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

export default WorkoutScreen;
