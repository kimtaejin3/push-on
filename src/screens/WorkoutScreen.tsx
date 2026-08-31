import React, {useEffect, useRef, useState} from 'react';
import {Alert, StyleSheet, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {RouteProp, useNavigation, useRoute} from '@react-navigation/native';
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
import {colors} from '../constants/colors';
import {formatTime} from '../utils/time';
import {generateUuid} from '../utils/id';
import {savePushupSession} from '../remote/pushup';
import {toProgramState} from '../remote/program';
import {completeDay, shouldSuggestRepeat} from '../domain/hundredPushups';
import {AppStackParamList} from '../navigations/AppNavigation';
import {activeProgramQueryOptions, useUpdateProgramMutation} from '../tanstack-query';
import {queryKeys} from '../tanstack-query/queryKeys';

/**
 * 세트 모드 / 100개 프로그램 공용 운동 화면.
 * 상태기계(useWorkoutSession)가 흐름을, usePushUpManager 가 실제 카운팅을 맡는다.
 */
function WorkoutScreen(): React.JSX.Element {
  const navigation = useNavigation();
  const {params} = useRoute<RouteProp<AppStackParamList, 'Workout'>>();
  const {plan, source} = params;
  const {user} = useSession();
  const queryClient = useQueryClient();

  const manager = usePushUpManager();
  const {state, target, start, count, finishSet, skipRest} = useWorkoutSession(plan);

  const workoutId = useRef(generateUuid()).current;
  const totalSeconds = useRef(0);
  const savedCount = useRef(0);
  const programUpdated = useRef(false);
  const [saveError, setSaveError] = useState(false);

  const {data: programRow} = useQuery({
    ...activeProgramQueryOptions(user?.id ?? ''),
    enabled: source.kind === 'program' && !!user?.id,
  });
  const updateProgram = useUpdateProgramMutation();

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
      savePushupSession({
        reps,
        duration_seconds: elapsed,
        mode: source.kind === 'program' ? 'program' : 'sets',
        workout_id: workoutId,
        set_index: index + 1,
        target_reps: plan.sets[index],
      })
        .then(() => queryClient.invalidateQueries({queryKey: queryKeys.pushup.all}))
        .catch(() => setSaveError(true));
    }
  }, [state.results, elapsed, handleStopTracking, plan.sets, source.kind, workoutId, queryClient]);

  // 프로그램: 목표를 충분히 채웠으면 자동으로 진행, 크게 못 미쳤으면 요약 화면에서 선택
  const suggestRepeat =
    source.kind === 'program' &&
    state.phase === 'done' &&
    shouldSuggestRepeat(plan.sets, state.results);

  const completeProgramDay = React.useCallback(() => {
    if (!programRow || programUpdated.current) {
      return;
    }
    programUpdated.current = true;
    const current = toProgramState(programRow);
    updateProgram.mutate({
      id: programRow.id,
      state: completeDay(current),
      completedDay: {
        week: current.week,
        day: current.day,
        reps: state.results,
        completed_at: new Date().toISOString(),
      },
      existing: programRow.completed_days,
    });
  }, [programRow, updateProgram, state.results]);

  useEffect(() => {
    if (state.phase !== 'done' || source.kind !== 'program' || suggestRepeat) {
      return;
    }
    completeProgramDay();
  }, [state.phase, source.kind, suggestRepeat, completeProgramDay]);

  const handleStart = () => {
    start();
    manager.handleStartTracking();
  };

  const handleAbort = () => {
    Alert.alert('운동 그만두기', '지금까지 끝낸 세트는 기록에 남아요.', [
      {text: '취소', style: 'cancel'},
      {
        text: '그만두기',
        style: 'destructive',
        onPress: () => {
          manager.handleStopTracking();
          navigation.navigate('Tabs' as never);
        },
      },
    ]);
  };

  if (state.phase === 'done') {
    // 목표 미달(80% 미만): 완료 처리 여부를 사용자가 고른다 (원본 프로그램의 '힘들면 반복' 권장)
    if (suggestRepeat) {
      return (
        <WorkoutSummary
          plan={plan}
          results={state.results}
          totalSeconds={totalSeconds.current}
          prompt={'목표에 조금 못 미쳤어요.\n이 날을 다시 하면 더 단단하게 넘어갈 수 있어요.'}
          doneLabel="완료하고 다음으로"
          onDone={() => {
            completeProgramDay();
            navigation.navigate('Program');
          }}
          secondaryAction={{
            label: '이 날 다시 하기',
            onPress: () => navigation.navigate('Program'),
          }}
        />
      );
    }
    return (
      <WorkoutSummary
        plan={plan}
        results={state.results}
        totalSeconds={totalSeconds.current}
        doneLabel={source.kind === 'program' ? '프로그램으로' : '홈으로'}
        onDone={() =>
          source.kind === 'program'
            ? navigation.navigate('Program')
            : navigation.navigate('Tabs' as never)
        }
      />
    );
  }

  const displayCount = state.phase === 'tracking' ? manager.pushUpCount : 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <WorkoutHeader setNumber={state.setIndex + 1} totalSets={plan.sets.length} target={target} />

        {state.phase === 'rest' ? (
          <RestTimer remaining={state.restRemaining} onSkip={skipRest} />
        ) : (
          <>
            <Count pushUpCount={displayCount} isGoingDown={manager.isGoingDown} />
            <TimerContainer formattedTime={formatTime(state.phase === 'tracking' ? elapsed : 0)} />
            <Engagement show={state.phase === 'tracking'} pushUpCount={displayCount} />
          </>
        )}

        {saveError && (
          <Text style={styles.warning}>세트 저장에 실패했어요. 네트워크를 확인해 주세요.</Text>
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
          <Text style={styles.abort} onPress={handleAbort}>
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
  warning: {fontSize: 13, color: colors.error, marginTop: 8},
  footer: {marginTop: 'auto', width: '100%', alignItems: 'center', gap: 16},
  instructionText: {fontSize: 16, textAlign: 'center', opacity: 0.8, color: colors.gray700, minHeight: 20},
  buttonContainer: {flexDirection: 'row', width: '100%', justifyContent: 'center'},
  button: {flex: 1, backgroundColor: colors.primaryDark},
  abort: {fontSize: 14, color: colors.gray400, padding: 8},
});

export default WorkoutScreen;
