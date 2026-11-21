import React, {useEffect, useRef, useState} from 'react';
import {ActivityIndicator, Alert, StyleSheet, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {RouteProp, StackActions, useNavigation, usePreventRemove, useRoute} from '@react-navigation/native';
import {useQuery, useQueryClient} from '@tanstack/react-query';
import usePushUpManager from '../hooks/usePushUpManager';
import {useWorkoutSession} from '../hooks/useWorkoutSession';
import {useSession} from '../hooks/useSession';
import CustomButton from '../components/common/CustomButton';
import Count from '../components/features/push-up/Count';
import TimerContainer from '../components/features/push-up/TimerContainer';
import Engagement from '../components/features/push-up/Engagement';
import WorkoutHeader from '../components/features/workout/WorkoutHeader';
import RestTimer from '../components/features/workout/RestTimer';
import WorkoutSummary from '../components/features/workout/WorkoutSummary';
import ProgramDaySummary from '../components/features/program/ProgramDaySummary';
import {colors} from '../constants/colors';
import {formatTime} from '../utils/time';
import {generateUuid} from '../utils/id';
import {saveWorkout} from '../remote/pushup';
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
import {downgradeNotice, nextStepLabel, withJosa} from '../domain/programMessages';
import {shouldConfirmLeave} from '../domain/workoutSession';
import {AppStackParamList} from '../navigations/AppNavigation';
import {currentProgramQueryOptions, useUpdateProgramMutation} from '../tanstack-query';
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
  const navigation = useNavigation();
  const {params} = useRoute<RouteProp<AppStackParamList, 'Workout'>>();
  const {plan, source} = params;
  const isProgram = source.kind === 'program';
  const {user} = useSession();
  const queryClient = useQueryClient();

  const manager = usePushUpManager();
  const {state, target, start, count, finishSet, skipRest} = useWorkoutSession(plan);

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

  // 네이티브 카운트 → 상태기계 (tracking 이 아니면 리듀서가 무시)
  useEffect(() => {
    count(manager.pushUpCount);
  }, [manager.pushUpCount, count]);

  // 세트 하나가 끝났을 때(결과 개수가 늘었을 때): 네이티브 정지 + 저장
  const {handleStopTracking} = manager;
  const elapsed = manager.timer.elapsedTime;
  useEffect(() => {
    if (state.results.length === savedCount.current) {
      return;
    }
    savedCount.current = state.results.length;
    const index = state.results.length - 1;
    const reps = state.results[index];
    totalSeconds.current += elapsed;
    handleStopTracking();
    if (reps > 0) {
      // 실패하면 폰에 보관했다가 다시 보낸다('queued') — 운동은 그대로 이어간다
      saveWorkout({
        reps,
        duration_seconds: elapsed,
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
  }, [state.results, elapsed, handleStopTracking, plan.sets, isProgram, workoutId, queryClient]);

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

  const handleStart = () => {
    start();
    manager.handleStartTracking();
  };

  // 운동 중(카운팅·휴식)에는 어떤 경로로 나가든 — 버튼, 안드로이드 뒤로가기, iOS 스와이프 —
  // 확인을 거친다. 확인창은 여기 한 곳에서만 띄운다.
  usePreventRemove(shouldConfirmLeave(state), ({data}) => {
    const message = isProgram
      ? '지금까지 끝낸 세트는 기록에 남아요.\n오늘 운동은 처음부터 다시 해야 해요.'
      : '지금까지 끝낸 세트는 기록에 남아요.';
    Alert.alert('운동 그만두기', message, [
      {text: '취소', style: 'cancel'},
      {
        text: '그만두기',
        style: 'destructive',
        onPress: () => {
          manager.handleStopTracking();
          navigation.dispatch(data.action);
        },
      },
    ]);
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
  const leaveSummary = (notice?: string) => {
    const go = () => goBackToStart(notice);
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

  if (state.phase === 'done') {
    if (!isProgram) {
      return (
        <WorkoutSummary
          plan={plan}
          results={state.results}
          totalSeconds={totalSeconds.current}
          doneLabel="홈으로"
          onDone={() => leaveSummary()}
        />
      );
    }
    if (unrecordable) {
      return (
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.pending}>
            <Text style={styles.pendingText}>
              운동하는 사이에 프로그램 진행 위치가 바뀌어서{'\n'}이번 운동은 진행에 반영하지 않았어요.{'\n'}
              세트 기록은 히스토리에 그대로 남아 있어요.
            </Text>
            <CustomButton title="프로그램으로" variant="start" onPress={() => goBackToStart()} />
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
                <Text style={styles.pendingText}>
                  프로그램 정보를 불러오지 못해 운동 결과를 반영하지 못했어요.{'\n'}네트워크를 확인하고 다시
                  시도해 주세요.
                </Text>
                <CustomButton title="다시 시도" variant="start" onPress={retrySave} />
              </>
            ) : (
              <>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.pendingText}>운동 결과를 반영하고 있어요</Text>
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
        totalSeconds={totalSeconds.current}
        passed={outcome.passed}
        streak={outcome.streak}
        nextLabel={outcome.nextLabel}
        downgrade={outcome.downgrade}
        save={{pending: recordMutation.isPending, error: recordMutation.isError, onRetry: retrySave}}
        move={{pending: moveMutation.isPending, error: moveMutation.isError}}
        onDone={() => leaveSummary()}
        onDowngrade={handleDowngrade}
      />
    );
  }

  const displayCount = state.phase === 'tracking' ? manager.pushUpCount : 0;

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
        onSkip={skipRest}
        last={{
          setNumber: index + 1,
          reps: state.results[index] ?? 0,
          target: plan.sets[index],
          isMax: plan.lastIsMax && index === lastSetIndex,
        }}
        next={{
          setNumber: nextIndex + 1,
          reps: plan.sets[nextIndex],
          isMax: plan.lastIsMax && nextIndex === lastSetIndex,
        }}
        note={note}
      />
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {state.phase === 'rest' ? (
          renderRest()
        ) : (
          <>
            <WorkoutHeader
              setNumber={state.setIndex + 1}
              totalSets={plan.sets.length}
              target={target}
              count={state.phase === 'tracking' ? displayCount : undefined}
            />
            <Count pushUpCount={displayCount} isGoingDown={manager.isGoingDown} />
            <TimerContainer formattedTime={formatTime(state.phase === 'tracking' ? elapsed : 0)} />
            <Engagement show={state.phase === 'tracking'} pushUpCount={displayCount} />
          </>
        )}

        {saveError && (
          <Text style={styles.warning}>
            {saveError === 'queued'
              ? '저장이 지연되고 있어요. 연결되면 자동으로 다시 보내요'
              : '세트를 저장하지 못했어요. 로그인 상태를 확인해 주세요'}
          </Text>
        )}

        <View style={styles.footer}>
          <Text style={styles.instructionText}>
            {state.phase === 'idle' ? '기기를 얼굴과 마주보게 바닥에 두세요' : ''}
          </Text>
          <View style={styles.buttonContainer}>
            {state.phase === 'idle' && (
              <CustomButton style={styles.button} title="시작하기" variant="start" onPress={handleStart} />
            )}
            {state.phase === 'tracking' && (
              <CustomButton style={styles.button} title="세트 종료" variant="stop" onPress={finishSet} />
            )}
          </View>
          <Text style={styles.abort} onPress={() => goBackToStart()}>
            운동 그만두기
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {flex: 1, backgroundColor: colors.backgroundDark},
  container: {flex: 1, alignItems: 'center', padding: 20},
  pending: {flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 20},
  pendingText: {fontSize: 15, lineHeight: 22, color: colors.textLight, textAlign: 'center'},
  warning: {fontSize: 13, color: colors.error, marginTop: 8},
  footer: {marginTop: 'auto', width: '100%', alignItems: 'center', gap: 16},
  instructionText: {fontSize: 16, textAlign: 'center', opacity: 0.8, color: colors.gray700, minHeight: 20},
  buttonContainer: {flexDirection: 'row', width: '100%', justifyContent: 'center'},
  button: {flex: 1, backgroundColor: colors.primaryDark},
  abort: {fontSize: 14, color: colors.gray400, padding: 8},
});

export default WorkoutScreen;
