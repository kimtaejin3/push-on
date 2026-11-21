import React, {useEffect, useRef} from 'react';
import {Alert, SafeAreaView, ScrollView, StyleSheet, Text, View} from 'react-native';
import {RouteProp, useNavigation, useRoute} from '@react-navigation/native';
import {useQuery} from '@tanstack/react-query';
import Header from '../components/common/Header';
import CustomButton from '../components/common/CustomButton';
import {colors} from '../constants/colors';
import {useSession} from '../hooks/useSession';
import {AppStackParamList} from '../navigations/AppNavigation';
import {
  currentProgramQueryOptions,
  useAbandonProgramMutation,
  useCreateProgramMutation,
  useUpdateProgramMutation,
} from '../tanstack-query';
import {toProgramState} from '../remote/program';
import {
  applyTest,
  describeSets,
  initialTestPreview,
  retestLevel,
  startProgram,
  todayPlan,
} from '../domain/hundredPushups';
import ReminderSettingsCard from '../components/features/program/ReminderSettingsCard';
import {cancelWorkoutReminders} from '../services/workoutReminder';
import {WEEKS} from '../constants/hundredPushups';

function ProgramScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<AppStackParamList, 'Program'>>();
  const testReps = route.params?.testReps;
  const {user} = useSession();

  const {data: programRow, isLoading} = useQuery(currentProgramQueryOptions(user?.id ?? ''));
  const createProgram = useCreateProgramMutation();
  const updateProgram = useUpdateProgramMutation();
  const abandonProgram = useAbandonProgramMutation();

  // 챌린지 화면(테스트)에서 돌아온 결과 반영 — 같은 결과를 두 번 처리하지 않는다
  const handledTest = useRef<number | undefined>(undefined);
  useEffect(() => {
    if (testReps === undefined || isLoading || !user || handledTest.current === testReps) {
      return;
    }
    handledTest.current = testReps;
    navigation.setParams({testReps: undefined} as never);
    if (!programRow) {
      createProgram.mutate({userId: user.id, state: startProgram(testReps)});
      return;
    }
    const state = toProgramState(programRow);
    // 테스트 차례면 주차 진행, 아니면 "레벨 다시 재기" 결과로 현재 주차의 열만 재배정
    const next = state.testDue ? applyTest(state, testReps) : retestLevel(state, testReps);
    if (next !== state) {
      updateProgram.mutate({id: programRow.id, state: next});
    }
  }, [testReps, isLoading, programRow, user, navigation, createProgram, updateProgram]);

  // 진행 중인 프로그램이 없으면(완료/중단 포함) 걸려 있던 운동 알림을 정리한다
  useEffect(() => {
    if (!isLoading && (!programRow || programRow.status !== 'active')) {
      cancelWorkoutReminders().catch(() => {});
    }
  }, [isLoading, programRow]);

  const goTest = () => navigation.navigate('Challenge', {purpose: 'program-test'});

  const handleRetest = () => {
    Alert.alert('레벨 다시 재기', '최대 횟수를 다시 재서 이번 주 세트를 다시 정해요.\n주차와 일차는 그대로예요.', [
      {text: '취소', style: 'cancel'},
      {text: '테스트 하기', onPress: goTest},
    ]);
  };

  const handleAbandon = () => {
    if (!programRow) {
      return;
    }
    Alert.alert('프로그램 그만두기', '진행 상황이 사라져요. 다시 시작하면 초기 테스트부터예요.', [
      {text: '취소', style: 'cancel'},
      {
        text: '그만두기',
        style: 'destructive',
        onPress: () => {
          abandonProgram.mutate(programRow.id);
          cancelWorkoutReminders().catch(() => {});
        },
      },
    ]);
  };

  const renderBody = () => {
    if (isLoading) {
      return null;
    }
    if (!programRow) {
      return (
        <>
          <View style={styles.card}>
            <Text style={styles.heading}>연속 100개 챌린지</Text>
            <Text style={styles.body}>
              주 3일, 하루 5세트.{'\n'}오늘 할 세트는 앱이 정해줘요.{'\n'}먼저 지금 몇 개까지 되는지 테스트해요.
            </Text>
            <Text style={styles.hint}>
              6주 프로그램이지만, 테스트 결과에 따라 시작 주차가 다르고{'\n'}같은 주차를 반복하기도 해서 기간은 사람마다 달라요.
            </Text>
            <Text style={styles.hint}>시작하면 운동하는 날 알림을 설정할 수 있어요</Text>
            <CustomButton title="초기 테스트 시작" variant="start" style={styles.button} onPress={goTest} />
          </View>

          <View style={styles.card}>
            <Text style={styles.previewTitle}>테스트 결과에 따라 이렇게 시작해요</Text>
            <Text style={styles.hint}>
              결과에 따라 시작 주차와 레벨이 정해져요.{'\n'}아래는 첫날(Day 1) 세트예요.
            </Text>
            {initialTestPreview().map(row => (
              <View key={row.range} style={styles.previewRow}>
                <Text style={styles.previewRange}>{row.range}</Text>
                <View style={styles.previewRight}>
                  <Text style={styles.previewSets}>{row.sets}</Text>
                  <Text style={styles.previewWeek}>
                    {row.week}주차 · 레벨 {row.level}
                  </Text>
                </View>
              </View>
            ))}
            <Text style={styles.hint}>
              세트 사이 60초 휴식, 마지막 세트는 최소 횟수 이상 가능한 만큼.{'\n'}
              Day 2 · Day 3 로 갈수록 횟수가 조금씩 늘어나요.{'\n'}
              2 · 4 · 5주차 끝에 다시 테스트해서 다음 주차 레벨을 정해요.
            </Text>
            <Text style={styles.link} onPress={() => navigation.navigate('ProgramTable')}>
              주차 · 레벨별 전체 세트 보기
            </Text>
          </View>
        </>
      );
    }
    const state = toProgramState(programRow);
    if (state.status === 'completed') {
      return (
        <View style={styles.card}>
          <Text style={styles.heading}>100개 달성</Text>
          <Text style={styles.body}>최종 테스트 {state.lastTestReps}회. 프로그램을 끝냈어요.</Text>
          <CustomButton
            title="다시 시작"
            variant="start"
            style={styles.button}
            onPress={() => abandonProgram.mutate(programRow.id)}
          />
        </View>
      );
    }
    if (state.testDue) {
      const isFinal = state.week === WEEKS;
      return (
        <View style={styles.card}>
          <Text style={styles.heading}>{isFinal ? '최종 테스트' : `${state.week}주차 테스트`}</Text>
          <Text style={styles.body}>
            {isFinal
              ? '연속으로 몇 개까지 되는지 재요. 100개면 완료예요.'
              : '결과에 따라 다음 주차의 세트가 정해져요.'}
          </Text>
          <CustomButton title="최대 횟수 테스트" variant="start" style={styles.button} onPress={goTest} />
        </View>
      );
    }
    const plan = todayPlan(state);
    return (
      <View style={styles.card}>
        <Text style={styles.heading}>
          {state.week}주차 · Day {state.day}
        </Text>
        <Text style={styles.sets}>{describeSets(plan.sets, plan.lastIsMax)}</Text>
        <Text style={styles.body}>세트 사이 휴식 {plan.restSeconds}초 · 마지막 세트는 가능한 만큼</Text>
        <Text style={styles.hint}>하루 쉬고 다음 운동을 권장해요</Text>
        <CustomButton
          title="오늘 운동 시작"
          variant="start"
          style={styles.button}
          onPress={() =>
            navigation.navigate('Workout', {plan, source: {kind: 'program', programId: programRow.id}})
          }
        />
        <Text style={styles.retest} onPress={handleRetest}>
          레벨 다시 재기
        </Text>
        <Text style={styles.link} onPress={() => navigation.navigate('ProgramTable')}>
          주차 · 레벨별 전체 세트 보기
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header title="100개 챌린지" onBackPress={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content}>
        {renderBody()}
        {programRow && programRow.status === 'active' && <ReminderSettingsCard />}
        {programRow && programRow.status === 'active' && (
          <Text style={styles.abandon} onPress={handleAbandon}>
            그만두기
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.backgroundDark},
  content: {padding: 20, gap: 24},
  card: {backgroundColor: colors.overlayLight, borderRadius: 16, padding: 24, gap: 12},
  heading: {fontSize: 22, fontWeight: '600', color: colors.textLight},
  sets: {fontSize: 28, fontWeight: 'bold', color: colors.textLight, marginVertical: 4},
  body: {fontSize: 15, lineHeight: 22, color: colors.textSecondary},
  hint: {fontSize: 13, lineHeight: 19, color: colors.gray400},
  previewTitle: {fontSize: 16, fontWeight: '600', color: colors.textLight, marginBottom: 4},
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.overlayMedium,
  },
  previewRange: {fontSize: 14, color: colors.textSecondary},
  previewRight: {alignItems: 'flex-end', gap: 2},
  previewSets: {fontSize: 15, fontWeight: '600', color: colors.textLight},
  previewWeek: {fontSize: 12, color: colors.gray400},
  button: {marginTop: 8},
  retest: {textAlign: 'center', fontSize: 14, color: colors.primaryLight, paddingTop: 4},
  link: {textAlign: 'center', fontSize: 14, color: colors.primaryLight, paddingTop: 8},
  abandon: {textAlign: 'center', fontSize: 14, color: colors.gray400, padding: 8},
});

export default ProgramScreen;
