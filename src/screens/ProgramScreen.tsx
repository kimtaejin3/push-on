import React, {useCallback, useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  useFocusEffect,
  useNavigation,
  useRoute,
  type CompositeNavigationProp,
  type RouteProp,
} from '@react-navigation/native';
import type {BottomTabNavigationProp} from '@react-navigation/bottom-tabs';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useQuery} from '@tanstack/react-query';
import Header from '../components/common/Header';
import CustomButton from '../components/common/CustomButton';
import {colors} from '../constants/colors';
import {useSession} from '../hooks/useSession';
import {useNow} from '../hooks/useNow';
import type {AppStackParamList} from '../navigations/AppNavigation';
import type {BottomTabParamList} from '../navigations/BottomTabNavigation';
import {
  currentProgramQueryOptions,
  useAbandonProgramMutation,
  useUpdateProgramMutation,
} from '../tanstack-query';
import {toProgramState} from '../remote/program';
import {
  downgradeTarget,
  initialTestPreview,
  moveRecord,
  moveTo,
  passedDayCount,
  todayPlan,
  todayProgress,
} from '../domain/hundredPushups';
import {downgradeNotice} from '../domain/programMessages';
import {resolveProgramView} from '../domain/programView';
import ReminderSettingsCard from '../components/features/program/ReminderSettingsCard';
import ProgramTodayCard from '../components/features/program/ProgramTodayCard';
import ProgramDoneTodayCard from '../components/features/program/ProgramDoneTodayCard';
import ProgramTestCard from '../components/features/program/ProgramTestCard';
import ProgramCompletedCard from '../components/features/program/ProgramCompletedCard';
import {cancelWorkoutReminders} from '../services/workoutReminder';

function ProgramScreen() {
  const navigation = useNavigation<
    CompositeNavigationProp<
      BottomTabNavigationProp<BottomTabParamList, 'Program'>,
      NativeStackNavigationProp<AppStackParamList>
    >
  >();
  const route = useRoute<RouteProp<BottomTabParamList, 'Program'>>();
  const {user} = useSession();
  // "오늘 완료" 판단은 지금 날짜를 따른다: 자정을 넘겨 다른 화면이나 앱 밖에서 돌아오면 다시 판단한다
  const {now, refresh: refreshNow} = useNow();
  useFocusEffect(useCallback(() => refreshNow(), [refreshNow]));

  // 하향·주차 변경 직후의 안내는 한 번만 보여준다:
  // 파라미터로 받으면 화면 상태로 옮기고, 닫거나 다른 화면으로 가면 사라진다.
  const [notice, setNotice] = useState<string>();
  const paramNotice = route.params?.notice;
  useEffect(() => {
    if (paramNotice) {
      setNotice(paramNotice);
      navigation.setParams({notice: undefined});
    }
  }, [paramNotice, navigation]);
  useEffect(() => navigation.addListener('blur', () => setNotice(undefined)), [navigation]);

  const programQuery = useQuery(currentProgramQueryOptions(user?.id ?? ''));
  const programRow = programQuery.data ?? null;
  // 조회 전(loading)·조회 실패(error)는 "프로그램 없음(none)"과 다르다 — 소개 화면을 보여주면 안 된다
  const view = resolveProgramView(programQuery);
  const abandonProgram = useAbandonProgramMutation();
  const moveProgram = useUpdateProgramMutation();

  // 진행 중인 프로그램이 없다는 게 확인됐을 때만(없음·완료) 걸려 있던 운동 알림을 정리한다
  useEffect(() => {
    if (view === 'none' || view === 'completed') {
      cancelWorkoutReminders().catch(() => {});
    }
  }, [view]);

  const goTest = () => navigation.navigate('Challenge', {purpose: 'program-test'});
  const openTable = () => navigation.navigate('ProgramTable');

  const handleRetest = () => {
    Alert.alert('레벨 다시 재기', '최대 횟수를 다시 재서 이번 주 세트를 다시 정해요.\n주차와 일차는 그대로예요.', [
      {text: '취소', style: 'cancel'},
      {text: '테스트 하기', onPress: goTest},
    ]);
  };

  const handleRestart = () => {
    Alert.alert('다시 시작', '초기 테스트부터 새로 시작해요.\n완료 기록은 그대로 남아요.', [
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
          setNotice(undefined);
          abandonProgram.mutate(programRow.id);
          cancelWorkoutReminders().catch(() => {});
        },
      },
    ]);
  };

  // 하향은 권유를 받고 사용자가 직접 누를 때만 일어난다
  const handleDowngrade = () => {
    if (!programRow) {
      return;
    }
    const state = toProgramState(programRow);
    const to = downgradeTarget(state);
    if (!to) {
      return;
    }
    const from = {week: state.week, day: state.day, level: state.level};
    const moved = moveTo(state, to);
    moveProgram.mutate(
      {
        id: programRow.id,
        state: moved,
        completedDay: moveRecord(moved, new Date().toISOString()),
        existing: programRow.completed_days,
      },
      {onSuccess: () => setNotice(downgradeNotice(from, to))},
    );
  };

  const renderIntro = () => (
    <>
      <View style={styles.card}>
        <Text style={styles.heading}>연속 100개 챌린지</Text>
        <Text style={styles.body}>
          매일, 하루 5세트 안팎.{'\n'}오늘 할 세트는 앱이 정해줘요.{'\n'}먼저 지금 몇 개까지 되는지 테스트해요.
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
          Day 가 지날수록 횟수가 조금씩 늘어나요.{'\n'}
          모든 세트를 채워야 다음 Day 로 넘어가요.{'\n'}
          2 · 4 · 5주차 끝에 다시 테스트해서 다음 주차 레벨을 정해요.
        </Text>
        <Text style={styles.link} onPress={openTable}>
          주차 · 레벨별 전체 세트 보기
        </Text>
      </View>
    </>
  );

  const renderBody = () => {
    if (view === 'loading') {
      return <ActivityIndicator style={styles.loading} size="large" color={colors.primary} />;
    }
    if (view === 'error') {
      return (
        <View style={styles.card}>
          <Text style={styles.heading}>프로그램 정보를 불러오지 못했어요</Text>
          <Text style={styles.body}>네트워크를 확인하고 다시 시도해 주세요. 진행 상황은 그대로 있어요.</Text>
          <CustomButton
            title="다시 시도"
            variant="start"
            style={styles.button}
            onPress={() => programQuery.refetch()}
          />
        </View>
      );
    }
    if (view === 'none' || !programRow) {
      return renderIntro();
    }
    const state = toProgramState(programRow);
    if (view === 'completed') {
      return (
        <ProgramCompletedCard
          lastTestReps={state.lastTestReps}
          startedAt={programRow.created_at}
          finishedAt={programRow.updated_at}
          passedDays={passedDayCount(programRow.completed_days)}
          onRestart={handleRestart}
        />
      );
    }
    if (view === 'testDue') {
      return (
        <ProgramTestCard
          state={state}
          records={programRow.completed_days}
          onTest={goTest}
          onOpenTable={openTable}
        />
      );
    }
    const startWorkout = () =>
      navigation.navigate('Workout', {
        plan: todayPlan(state),
        source: {kind: 'program', programId: programRow.id},
      });
    // 오늘 할 일을 마쳤으면 다음 Day 는 내일로 안내한다 (미리 하기는 막지 않는다)
    const progress = todayProgress(programRow.completed_days, state, programRow.created_at, now);
    if (progress !== 'open') {
      return (
        <ProgramDoneTodayCard kind={progress} next={state} onStartEarly={startWorkout} onOpenTable={openTable} />
      );
    }
    return (
      <ProgramTodayCard
        state={state}
        records={programRow.completed_days}
        onStart={startWorkout}
        onRetest={handleRetest}
        onOpenTable={openTable}
        onDowngrade={handleDowngrade}
        downgradePending={moveProgram.isPending}
        downgradeError={moveProgram.isError}
      />
    );
  };

  const inProgress = view === 'active' || view === 'testDue';

  return (
    <SafeAreaView style={styles.container}>
      <Header title="100개 챌린지" />
      <ScrollView contentContainerStyle={styles.content}>
        {notice ? (
          <Pressable style={styles.notice} onPress={() => setNotice(undefined)}>
            <Text style={styles.noticeText}>{notice}</Text>
            <Text style={styles.noticeClose}>닫기</Text>
          </Pressable>
        ) : null}
        {renderBody()}
        {inProgress && <ReminderSettingsCard />}
        {inProgress && (
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
  loading: {marginTop: 80},
  card: {backgroundColor: colors.overlayLight, borderRadius: 16, padding: 24, gap: 12},
  heading: {fontSize: 22, fontWeight: '600', color: colors.textLight},
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
  link: {textAlign: 'center', fontSize: 14, color: colors.primaryLight, paddingTop: 8},
  abandon: {textAlign: 'center', fontSize: 14, color: colors.gray400, padding: 8},
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.primaryOverlayMedium,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  noticeText: {flex: 1, fontSize: 14, lineHeight: 20, color: colors.textLight},
  noticeClose: {fontSize: 13, color: colors.primaryLight},
});

export default ProgramScreen;
