import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
} from 'react';
import {Pressable, ScrollView, StyleSheet, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {
  useFocusEffect,
  useNavigation,
  useRoute,
  type CompositeNavigationProp,
  type RouteProp,
} from '@react-navigation/native';
import type {BottomTabNavigationProp} from '@react-navigation/bottom-tabs';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {skipToken, useQuery} from '@tanstack/react-query';
import {List} from 'lucide-react-native';
import ProgramTodayCard from '../components/features/program/ProgramTodayCard';
import ProgramDoneTodayCard from '../components/features/program/ProgramDoneTodayCard';
import ProgramTestCard from '../components/features/program/ProgramTestCard';
import ProgramCompletedCard from '../components/features/program/ProgramCompletedCard';
import ProgramPathView from '../components/features/program/ProgramPathView';
import {Button} from '../components/ui/Button';
import {Card} from '../components/ui/Card';
import {Icon, type LucideName} from '../components/ui/Icon';
import {ScreenHeader} from '../components/ui/ScreenHeader';
import {Text} from '../components/ui/Text';
import {ConfirmDialog} from '../components/ui/feedback/ConfirmDialog';
import {ErrorState} from '../components/ui/feedback/ErrorState';
import {Skeleton} from '../components/ui/feedback/Skeleton';
import {useSession} from '../hooks/useSession';
import {useNow} from '../hooks/useNow';
import type {AppStackParamList} from '../navigations/AppNavigation';
import type {BottomTabParamList} from '../navigations/BottomTabNavigation';
import {
  currentProgramQueryOptions,
  useAbandonProgramMutation,
  useUpdateProgramMutation,
} from '../tanstack-query';
import {queryKeys} from '../tanstack-query/queryKeys';
import {toProgramState} from '../remote/program';
import {getInitialTestReps} from '../remote/programTests';
import {
  DOWNGRADE_AFTER,
  downgradeTarget,
  failStreak,
  initialTestPreview,
  moveRecord,
  moveTo,
  todayPlan,
  todayProgress,
  type Position,
} from '../domain/hundredPushups';
import {downgradeNotice, jumpNotice} from '../domain/programMessages';
import {resolveProgramView, weekRestartTarget} from '../domain/programView';
import {cancelWorkoutReminders} from '../services/workoutReminder';
import {color, layout, radius, space} from '../theme';
import {weekJumpConfirmation} from './ProgramTableScreen';

type Dialog = Omit<
  ComponentProps<typeof ConfirmDialog>,
  'visible' | 'onCancel'
>;

function ProgramIntro({onOpenTable}: {onOpenTable: () => void}) {
  return (
    <>
      <Card>
        <Text variant="title">연속 100개 챌린지</Text>
        <Text>
          매일, 하루 5세트 안팎.{'\n'}
          오늘 할 세트는 앱이 정해줘요.{'\n'}
          먼저 지금 몇 개까지 되는지 테스트해요.
        </Text>
        <Text variant="caption" color="textMuted">
          6주 프로그램이지만, 테스트 결과에 따라 시작 주차가 다르고 같은 주차를
          반복하기도 해서 기간은 사람마다 달라요.
        </Text>
        <Text variant="caption" color="textMuted">
          설정에서 운동 알림을 켤 수 있어요.
        </Text>
      </Card>

      <Card>
        <Text variant="headline">테스트 결과에 따라 이렇게 시작해요</Text>
        <Text variant="caption" color="textMuted">
          아래는 첫날(Day 1) 세트예요.
        </Text>
        {initialTestPreview().map(row => (
          <View key={row.range} style={styles.previewRow}>
            <Text variant="label">{row.range}</Text>
            <View style={styles.previewValues}>
              <Text variant="label" weight={700} style={styles.previewSets}>
                {row.sets}
              </Text>
              <Text variant="caption" color="textMuted">
                {row.week}주차 · 레벨 {row.level}
              </Text>
            </View>
          </View>
        ))}
        <Text variant="caption" color="textMuted">
          세트 사이 60초 휴식, 마지막 세트는 최소 횟수 이상 가능한 만큼.{'\n'}
          Day가 지날수록 횟수가 조금씩 늘어나요.{'\n'}
          모든 세트를 채워야 다음 Day로 넘어가요.{'\n'}2 · 4 · 5주차 끝에 다시
          테스트해서 다음 주차 레벨을 정해요.
        </Text>
        <Button
          variant="text"
          title="주차 · 레벨별 전체 세트 보기"
          icon="chevron-right"
          onPress={onOpenTable}
        />
      </Card>
    </>
  );
}

function PathAction({
  title,
  icon,
  disabled,
  onPress,
}: {
  title: string;
  icon: LucideName;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{disabled}}
      disabled={disabled}
      onPress={onPress}
      style={({pressed}) => [
        styles.pathAction,
        (pressed || disabled) && styles.dimmed,
      ]}>
      <Icon name={icon} size={18} />
      <Text variant="label" weight={800} style={styles.pathActionLabel}>
        {title}
      </Text>
    </Pressable>
  );
}

function ProgramScreen() {
  const navigation =
    useNavigation<
      CompositeNavigationProp<
        BottomTabNavigationProp<BottomTabParamList, 'Program'>,
        NativeStackNavigationProp<AppStackParamList>
      >
    >();
  const route = useRoute<RouteProp<BottomTabParamList, 'Program'>>();
  const {user} = useSession();
  // 자정을 넘겨 다른 화면이나 앱 밖에서 돌아오면 오늘 상태를 다시 판단한다
  const {now, refresh: refreshNow} = useNow();
  useFocusEffect(useCallback(() => refreshNow(), [refreshNow]));

  const [notice, setNotice] = useState<string>();
  const [dialog, setDialog] = useState<Dialog>();
  const [moveKind, setMoveKind] = useState<'week' | 'downgrade'>();
  const scroll = useRef<ScrollView>(null);
  const paramNotice = route.params?.notice;
  useEffect(() => {
    if (paramNotice) {
      setNotice(paramNotice);
      navigation.setParams({notice: undefined});
    }
  }, [paramNotice, navigation]);
  useEffect(
    () =>
      navigation.addListener('blur', () => {
        setNotice(undefined);
        setDialog(undefined);
      }),
    [navigation],
  );

  useEffect(() => {
    if (notice) {
      scroll.current?.scrollTo({y: 0, animated: true});
    }
  }, [notice]);

  const programQuery = useQuery(currentProgramQueryOptions(user?.id ?? ''));
  const programRow = programQuery.data ?? null;
  const view = resolveProgramView(programQuery);
  const programCreatedAt =
    programRow?.user_id === user?.id ? programRow?.created_at : undefined;
  const {data: initialTestReps = null} = useQuery({
    queryKey: [
      ...queryKeys.pushup.all,
      'programInitialTest',
      user?.id,
      programCreatedAt,
    ],
    queryFn: programCreatedAt
      ? () => getInitialTestReps(programCreatedAt)
      : skipToken,
  });
  const abandonProgram = useAbandonProgramMutation();
  const moveProgram = useUpdateProgramMutation();
  const busy = abandonProgram.isPending || moveProgram.isPending;
  const inProgress = view === 'active' || view === 'testDue';

  // 진행 중인 프로그램이 없다는 게 확인됐을 때만 걸려 있던 운동 알림을 정리한다
  useEffect(() => {
    if (view === 'none' || view === 'completed') {
      cancelWorkoutReminders().catch(() => {});
    }
  }, [view]);

  const goTest = () =>
    navigation.navigate('Challenge', {purpose: 'program-test'});
  const openTable = () => navigation.navigate('ProgramTable');

  const confirmRetest = () =>
    setDialog({
      title: '레벨 다시 재기',
      message:
        '최대 횟수를 다시 재서 이번 주 세트를 다시 정해요.\n주차와 일차는 그대로예요.',
      confirmLabel: '테스트 하기',
      cancelLabel: '취소',
      onConfirm: goTest,
    });

  const confirmRestart = () =>
    setDialog({
      title: '다시 시작',
      message: '초기 테스트부터 새로 시작해요.\n완료 기록은 그대로 남아요.',
      confirmLabel: '테스트 하기',
      cancelLabel: '취소',
      onConfirm: goTest,
    });

  let body: ReactNode;
  let footer: ReactNode;

  if (view === 'loading') {
    body = (
      <View
        accessible
        accessibilityLabel="프로그램 불러오는 중"
        style={styles.loading}>
        <Skeleton width={220} height={56} />
        <Skeleton width="fill" height={8} />
        <Skeleton width="fill" height={136} radius={radius.l} />
      </View>
    );
  } else if (view === 'error') {
    body = (
      <ErrorState
        title="프로그램 정보를 불러오지 못했어요"
        message="네트워크를 확인하고 다시 시도해 주세요. 진행 상황은 그대로 있어요."
        actionLabel="다시 시도"
        onAction={() => programQuery.refetch()}
      />
    );
  } else if (view === 'none' || !programRow) {
    body = <ProgramIntro onOpenTable={openTable} />;
    footer = (
      <Button
        variant="primary"
        title="초기 테스트 시작"
        icon="play"
        onPress={goTest}
      />
    );
  } else if (view === 'completed') {
    body = (
      <ProgramCompletedCard
        initialTestReps={initialTestReps}
        lastTestReps={programRow.last_test_reps}
        startedAt={programRow.created_at}
        finishedAt={programRow.updated_at}
        records={programRow.completed_days}
        onRestart={confirmRestart}
      />
    );
  } else {
    const state = toProgramState(programRow);
    const records = programRow.completed_days;
    const progress =
      view === 'testDue'
        ? 'open'
        : todayProgress(records, state, programRow.created_at, now);
    const streak =
      progress === 'open' && view === 'active' ? failStreak(records, state) : 0;
    const downgrade = streak >= DOWNGRADE_AFTER ? downgradeTarget(state) : null;

    const startWorkout = () =>
      navigation.navigate('Workout', {
        plan: todayPlan(state),
        source: {kind: 'program', programId: programRow.id},
      });

    const move = (
      to: Position,
      kind: 'week' | 'downgrade',
      onSuccess: () => void,
      onError?: () => void,
    ) => {
      if (busy) {
        return;
      }
      setMoveKind(kind);
      const moved = moveTo(state, to);
      moveProgram.mutate(
        {
          id: programRow.id,
          state: moved,
          completedDay: moveRecord(moved, new Date().toISOString()),
          existing: records,
        },
        {onSuccess, onError},
      );
    };

    // 주차 첫날이면 같은 주차를 다시 하는 게 의미 없어 앞 주차로 보낸다 (1주차 첫날이면 없음)
    const restartTo = weekRestartTarget(state);
    const confirmWeekRestart = (to: Position) => {
      setDialog({
        ...weekJumpConfirmation(state, to),
        onConfirm: () =>
          move(
            to,
            'week',
            () => setNotice(jumpNotice(to)),
            () =>
              setDialog({
                title: '주차를 바꾸지 못했어요',
                message: '네트워크를 확인하고 다시 시도해 주세요.',
                confirmLabel: '확인',
                onConfirm: () => setDialog(undefined),
              }),
          ),
      });
    };

    const confirmAbandon = () =>
      setDialog({
        title: '프로그램 그만두기',
        message: '진행 상황이 사라져요. 다시 시작하면 초기 테스트부터예요.',
        confirmLabel: '그만두기',
        cancelLabel: '취소',
        destructive: true,
        onConfirm: () => {
          setNotice(undefined);
          abandonProgram.mutate(programRow.id);
          cancelWorkoutReminders().catch(() => {});
        },
      });

    let todayCard: ReactNode;
    if (view === 'testDue') {
      todayCard = <ProgramTestCard state={state} records={records} now={now} />;
      footer = (
        <Button
          variant="primary"
          title="최대 횟수 테스트"
          icon="flag"
          disabled={busy}
          onPress={goTest}
        />
      );
    } else if (progress !== 'open') {
      todayCard = <ProgramDoneTodayCard kind={progress} next={state} />;
      footer = (
        <Button
          variant="text"
          title="미리 하기"
          icon="chevron-right"
          disabled={busy}
          onPress={startWorkout}
        />
      );
    } else {
      todayCard = (
        <ProgramTodayCard
          state={state}
          records={records}
          streak={streak}
          downgrade={downgrade}
          onDowngrade={() => {
            if (downgrade) {
              move(downgrade, 'downgrade', () =>
                setNotice(downgradeNotice(state, downgrade)),
              );
            }
          }}
          downgradePending={moveKind === 'downgrade' && moveProgram.isPending}
          downgradeError={moveKind === 'downgrade' && moveProgram.isError}
          disabled={busy}
        />
      );
      footer = (
        <Button
          variant="primary"
          title={
            downgrade
              ? '이 레벨로 한 번 더'
              : `${state.week}주차 ${state.day}일차 시작`
          }
          icon="play"
          disabled={busy}
          onPress={startWorkout}
        />
      );
    }

    body = (
      <>
        <ProgramPathView
          state={state}
          records={records}
          initialTestReps={initialTestReps}
          doneToday={progress !== 'open'}>
          {todayCard}
        </ProgramPathView>
        <View style={styles.alternatives}>
          <Text weight={800}>힘들면 이렇게 골라도 돼요</Text>
          <Text variant="label" color="textMuted" weight={500}>
            고르지 않으면 지금 순서대로 이어가요. 어느 쪽을 골라도 기록은 그대로
            남아요.
          </Text>
          <View style={styles.pathActions}>
            {restartTo && (
              <PathAction
                title={
                  restartTo.week === state.week
                    ? `${state.week}주차 다시 하기`
                    : `${restartTo.week}주차로 돌아가기`
                }
                icon="rotate-ccw"
                disabled={busy}
                onPress={() => confirmWeekRestart(restartTo)}
              />
            )}
            {view !== 'testDue' && (
              <PathAction
                title="지금 다시 테스트"
                icon="flag"
                disabled={busy}
                onPress={confirmRetest}
              />
            )}
          </View>
        </View>
        <View>
          <Button
            variant="text"
            title="전체 세트 보기 · 주차 바꾸기"
            icon="chevron-right"
            disabled={busy}
            onPress={openTable}
          />
          <Button
            variant="text"
            title="그만두기"
            disabled={busy}
            onPress={confirmAbandon}
          />
        </View>
      </>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {view === 'completed' ? (
        body
      ) : (
        <>
          <ScreenHeader
            title="100개 챌린지"
            right={
              inProgress ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="전체 세트 보기"
                  accessibilityState={{disabled: busy}}
                  disabled={busy}
                  onPress={openTable}
                  style={({pressed}) => [
                    styles.headerAction,
                    (pressed || busy) && styles.dimmed,
                  ]}>
                  <List size={24} color={color.text} />
                </Pressable>
              ) : undefined
            }
          />
          <ScrollView ref={scroll} contentContainerStyle={styles.content}>
            {notice && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={notice + ', 안내 닫기'}
                accessibilityLiveRegion="polite"
                style={styles.notice}
                onPress={() => setNotice(undefined)}>
                <Text variant="label" style={styles.noticeText}>
                  {notice}
                </Text>
                <Text variant="label" color="active">
                  닫기
                </Text>
              </Pressable>
            )}
            {body}
          </ScrollView>
          {footer && <View style={styles.footer}>{footer}</View>}
        </>
      )}
      {dialog && (
        <ConfirmDialog
          {...dialog}
          visible
          onCancel={() => setDialog(undefined)}
          onConfirm={() => {
            setDialog(undefined);
            dialog.onConfirm();
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: color.bg},
  content: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: space[8],
    paddingBottom: space[24],
    gap: space[24],
  },
  headerAction: {
    width: layout.touchMin,
    height: layout.touchMin,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loading: {paddingTop: space[16], gap: space[16]},
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[12],
    paddingVertical: space[8],
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: color.border,
  },
  previewValues: {flex: 1, alignItems: 'flex-end', gap: space[4]},
  previewSets: {textAlign: 'right'},
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: layout.touchMin,
    gap: space[12],
    backgroundColor: color.activeSoft,
    borderRadius: radius.m,
    padding: space[12],
  },
  noticeText: {flex: 1},
  alternatives: {gap: space[12]},
  pathActions: {flexDirection: 'row', gap: space[8]},
  pathAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: layout.primaryButtonHeight,
    gap: space[8],
    paddingHorizontal: space[8],
    paddingVertical: space[8],
    backgroundColor: color.surface2,
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: radius.m,
  },
  pathActionLabel: {flexShrink: 1, textAlign: 'center'},
  dimmed: {opacity: 0.55},
  footer: {
    alignItems: 'stretch',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: color.border,
    paddingHorizontal: layout.screenPadding,
    paddingTop: space[12],
    paddingBottom: space[8],
  },
});

export default ProgramScreen;
