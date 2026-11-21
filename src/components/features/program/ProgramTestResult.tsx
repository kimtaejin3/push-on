import React, {useRef, useState} from 'react';
import {ActivityIndicator, StyleSheet, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {StackActions, useNavigation} from '@react-navigation/native';
import {useQuery, useQueryClient} from '@tanstack/react-query';
import FontAwesome5 from '@react-native-vector-icons/fontawesome5';
import CustomButton from '../../common/CustomButton';
import {colors} from '../../../constants/colors';
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
import {formatTime} from '../../../utils/time';
import {useStreakCelebration} from '../streak/StreakCelebrationProvider';

interface ProgramTestResultProps {
  reps: number;
  /** 초 */
  duration: number;
}

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
function ProgramTestResult({reps, duration}: ProgramTestResultProps): React.JSX.Element {
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

  const goProgram = () =>
    navigation.dispatch(StackActions.popTo('Tabs', {screen: 'Program'}));
  const {celebrateThen} = useStreakCelebration();
  // 반영에 성공해 프로그램으로 돌아갈 때만 축하 화면을 거친다 (0개 결과는 goProgram 으로 바로 간다)
  const finish = () => celebrateThen(goProgram);

  const handleSave = async () => {
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

  const renderBody = () => {
    if (reps === 0) {
      return (
        <>
          <View style={styles.header}>
            <FontAwesome5 name="times-circle" iconStyle="solid" size={60} color={colors.primary} />
            <Text style={styles.message}>측정된 푸쉬업 횟수가 없어요</Text>
            <Text style={styles.sub}>프로그램은 그대로예요. 다시 재볼 수 있어요.</Text>
          </View>
          <View style={styles.footer}>
            <CustomButton title="프로그램으로" variant="start" onPress={goProgram} />
          </View>
        </>
      );
    }
    if (!result) {
      // 프로그램 상태를 모르면 결과를 해석할 수 없다 — "없음"으로 취급해 새로 만들지 않는다
      return view === 'error' ? (
        <View style={styles.header}>
          <Text style={styles.count}>{reps}개</Text>
          <Text style={styles.message}>프로그램 정보를 불러오지 못했어요</Text>
          <Text style={styles.sub}>네트워크를 확인하고 다시 시도해 주세요. 방금 결과는 그대로 있어요.</Text>
          <CustomButton title="다시 시도" variant="start" style={styles.retry} onPress={() => query.refetch()} />
        </View>
      ) : (
        <View style={styles.header}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      );
    }

    const {title, body} = testOutcomeMessage(reps, result.outcome);
    const {next} = result;
    const showNext = result.outcome.kind !== 'completed';
    const plan = todayPlan(next);
    return (
      <>
        <View style={styles.header}>
          <FontAwesome5 name="check-circle" iconStyle="solid" size={60} color={colors.primary} />
          <Text style={styles.count}>{title}</Text>
          <Text style={styles.message}>{body}</Text>
          <Text style={styles.sub}>소요시간 {formatTime(duration)}</Text>
        </View>

        {showNext && (
          <View style={styles.nextCard}>
            <Text style={styles.nextLabel}>다음 운동</Text>
            <Text style={styles.nextTitle}>
              {next.week}주차 · Day {next.day} · 레벨 {next.level}
            </Text>
            <Text style={styles.nextSets}>{describeSets(plan.sets, plan.lastIsMax)}</Text>
          </View>
        )}

        <View style={styles.footer}>
          {saveFailed && (
            <Text style={styles.warning}>결과를 저장하지 못했어요. 네트워크를 확인해 주세요.</Text>
          )}
          <CustomButton
            title={saving ? '저장 중…' : saveFailed ? '다시 시도' : '기록하고 프로그램으로'}
            variant="start"
            disabled={saving}
            style={saving && styles.disabled}
            onPress={handleSave}
          />
        </View>
      </>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>{renderBody()}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {flex: 1, backgroundColor: colors.backgroundDark},
  container: {flex: 1, alignItems: 'center', padding: 20},
  header: {alignItems: 'center', marginTop: 60, marginBottom: 32, gap: 12, width: '100%'},
  count: {fontSize: 44, fontWeight: 'bold', color: colors.textLight, marginTop: 8},
  message: {fontSize: 18, lineHeight: 26, fontWeight: '600', color: colors.textLight, textAlign: 'center'},
  sub: {fontSize: 14, lineHeight: 20, color: colors.gray400, textAlign: 'center'},
  retry: {marginTop: 12},
  nextCard: {
    width: '100%',
    backgroundColor: colors.overlayLight,
    borderRadius: 16,
    padding: 20,
    gap: 6,
  },
  nextLabel: {fontSize: 13, color: colors.gray400},
  nextTitle: {fontSize: 16, fontWeight: '600', color: colors.textLight},
  nextSets: {fontSize: 22, fontWeight: 'bold', color: colors.textLight},
  footer: {marginTop: 'auto', width: '100%', alignItems: 'center', gap: 12},
  warning: {fontSize: 13, color: colors.error, textAlign: 'center'},
  disabled: {opacity: 0.6},
});

export default ProgramTestResult;
