import React, {useRef, useState} from 'react';
import {StackActions, useNavigation} from '@react-navigation/native';
import {useQuery, useQueryClient} from '@tanstack/react-query';
import {useSession} from '../../../hooks/useSession';
import {
  currentProgramQueryOptions,
  useCreateProgramMutation,
  useUpdateProgramMutation,
} from '../../../tanstack-query';
import {queryKeys} from '../../../tanstack-query/queryKeys';
import {saveWorkout} from '../../../remote/pushup';
import {ProgramRow, toProgramState} from '../../../remote/program';
import {
  describeSets,
  ProgramState,
  resolveTest,
  TestOutcome,
  testRecord,
  todayPlan,
} from '../../../domain/hundredPushups';
import {testOutcomeMessage} from '../../../domain/programMessages';
import {canStartNewProgram, resolveProgramView} from '../../../domain/programView';
import {useStreakCelebration} from '../streak/StreakCelebrationProvider';
import {Card} from '../../ui/Card';
import {Text} from '../../ui/Text';
import {NextWorkout, ResultLayout} from '../result/ResultLayout';

interface ProgramTestResultProps {
  reps: number;
  /** 초 */
  duration: number;
  /** 테스트를 시작한 시각. 지난번·최고 기록은 이보다 앞선 기록과 비교한다 */
  beforeIso: string;
}

type Destination = 'Program' | 'History';

type Resolved = {
  /** 반영할 프로그램 행. 새로 시작하는 경우 null */
  row: ProgramRow | null;
  createNew: boolean;
  next: ProgramState;
  outcome: TestOutcome;
};

/**
 * 100개 챌린지의 최대 횟수 테스트 결과 화면.
 * 결과가 무엇을 뜻하는지(시작 위치·다음 주차·반복 이유) 알려주고, 프로그램에 반영한다.
 * 반영이 실패하면 조용히 넘어가지 않고 다시 시도를 준다.
 */
function ProgramTestResult({reps, duration, beforeIso}: ProgramTestResultProps): React.JSX.Element {
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const {user} = useSession();
  const query = useQuery(currentProgramQueryOptions(user?.id ?? ''));
  const view = resolveProgramView(query);
  const createProgram = useCreateProgramMutation();
  const updateProgram = useUpdateProgramMutation();

  const [saving, setSaving] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  const sessionSaved = useRef(false);

  // 결과 해석은 화면에 들어왔을 때의 프로그램 상태로 한 번만 정한다.
  // (저장에 성공하면 캐시가 바뀌는데, 그때 문구가 다시 계산되면 안 된다)
  const resolved = useRef<Resolved | null>(null);
  if (!resolved.current && reps > 0 && view !== 'loading' && view !== 'error') {
    const row = query.data ?? null;
    const createNew = canStartNewProgram(view);
    resolved.current = {
      row: createNew ? null : row,
      createNew,
      ...resolveTest(row ? toProgramState(row) : null, reps),
    };
  }
  const result = resolved.current;

  const goTo = (to: Destination) =>
    navigation.dispatch(StackActions.popTo('Tabs', {screen: to}));
  const {celebrateThen} = useStreakCelebration();

  // [확인]은 프로그램으로, [기록에서 보기]는 기록 탭으로 — 둘 다 결과를 반영한 뒤 떠난다
  const handleSave = async (to: Destination) => {
    // 반영에 성공해 떠날 때만 축하 화면을 거친다 (0개 결과는 goTo 로 바로 간다)
    const finish = () => celebrateThen(() => goTo(to));
    if (saving || !result || !user) {
      return;
    }
    setSaving(true);
    setSaveFailed(false);
    // 히스토리 기록은 한 번만 보낸다. 실패하면 saveWorkout 이 폰에 보관했다가 다시 보내고,
    // 프로그램 반영은 막지 않는다
    if (!sessionSaved.current) {
      sessionSaved.current = true;
      try {
        await saveWorkout({reps, duration_seconds: duration, mode: 'program_test'});
        queryClient.invalidateQueries({queryKey: queryKeys.pushup.all});
      } catch (error) {
        console.error('테스트 기록 저장 실패:', error);
      }
    }
    try {
      if (result.createNew) {
        // 다시 시도일 때: 앞선 요청이 늦게 성공했을 수 있으니 먼저 확인한다 (프로그램 중복 생성 방지)
        if (saveFailed) {
          const {data: latest} = await query.refetch();
          if (latest?.status === 'active') {
            finish();
            return;
          }
        }
        await createProgram.mutateAsync({userId: user.id, state: result.next});
      } else if (result.row) {
        // 테스트를 한 날로 남긴다: 오늘 할 일을 했는지 판단하고 연속 실패를 끊는 데 쓴다
        await updateProgram.mutateAsync({
          id: result.row.id,
          state: result.next,
          completedDay: testRecord(result.next, new Date().toISOString()),
          existing: result.row.completed_days,
        });
      }
      finish();
    } catch {
      setSaveFailed(true);
      setSaving(false);
    }
  };

  if (reps === 0) {
    return (
      <ResultLayout
        mode="program_test"
        beforeIso={beforeIso}
        completion="최대 횟수 테스트 · 측정 안 됨"
        neutral
        results={[0]}
        seconds={duration}
        headline="측정된 푸쉬업 횟수가 없어요"
        action={{title: '확인', onPress: () => goTo('Program')}}>
        <Card>
          <Text color="textMuted">프로그램은 그대로예요. 다시 재볼 수 있어요.</Text>
        </Card>
      </ResultLayout>
    );
  }

  if (!result) {
    // 프로그램 상태를 모르면 결과를 해석할 수 없다 — "없음"으로 취급해 새로 만들지 않는다
    const failed = view === 'error';
    return (
      <ResultLayout
        mode="program_test"
        beforeIso={beforeIso}
        completion="최대 횟수 테스트"
        results={[reps]}
        seconds={duration}
        headline={failed ? '프로그램 정보를 불러오지 못했어요' : '결과를 해석하고 있어요'}
        warning={
          failed ? '네트워크를 확인하고 다시 시도해 주세요. 방금 결과는 그대로 있어요.' : undefined
        }
        action={{
          title: '다시 시도',
          onPress: () => query.refetch(),
          loading: !failed,
        }}
      />
    );
  }

  const {body} = testOutcomeMessage(reps, result.outcome);
  const {next} = result;
  const showNext = result.outcome.kind !== 'completed';
  const plan = todayPlan(next);
  const missedTest = result.outcome.kind === 'repeat' || result.outcome.kind === 'finalMiss';
  return (
    <ResultLayout
      mode="program_test"
      beforeIso={beforeIso}
      completion="최대 횟수 테스트 완료"
      neutral={missedTest}
      results={[reps]}
      seconds={duration}
      headline={body}
      warning={saveFailed ? '결과를 저장하지 못했어요. 네트워크를 확인해 주세요.' : undefined}
      action={{
        title: saveFailed ? '다시 시도' : '확인',
        onPress: () => handleSave('Program'),
        loading: saving,
      }}
      onHistory={() => handleSave('History')}>
      {showNext && (
        <NextWorkout
          title={`다음 운동 · ${next.week}주차 Day ${next.day} · 레벨 ${next.level}`}
          detail={describeSets(plan.sets, plan.lastIsMax)}
        />
      )}
    </ResultLayout>
  );
}

export default ProgramTestResult;
