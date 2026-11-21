import React, {useState} from 'react';
import {ScrollView, StyleSheet, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {StackActions, useNavigation} from '@react-navigation/native';
import {useQuery} from '@tanstack/react-query';
import {Button} from '../components/ui/Button';
import {Card} from '../components/ui/Card';
import {ScreenHeader} from '../components/ui/ScreenHeader';
import {SegmentedControl} from '../components/ui/SegmentedControl';
import {Text} from '../components/ui/Text';
import {ConfirmDialog} from '../components/ui/feedback/ConfirmDialog';
import {useSession} from '../hooks/useSession';
import {
  currentProgramQueryOptions,
  useUpdateProgramMutation,
} from '../tanstack-query';
import {toProgramState} from '../remote/program';
import {
  levelRange,
  moveRecord,
  moveTo,
  programTable,
  type Level,
  type Position,
  type ProgramState,
} from '../domain/hundredPushups';
import {jumpNotice} from '../domain/programMessages';
import {resolveProgramView} from '../domain/programView';
import {color, layout, space} from '../theme';

const LEVELS: Level[] = [1, 2, 3];
const levelTabs = LEVELS.map(level => ({
  key: String(level),
  label: `레벨 ${level}`,
}));

// 1주차 레벨 1 처럼 min 이 0 이면 "0~5개" 대신 "5개 이하"로 읽히게 한다
const rangeText = ({min, max}: {min: number; max: number | null}): string =>
  max === null
    ? `${min}개 이상`
    : min === 0
    ? `${max}개 이하`
    : `${min}~${max}개`;

const inRange = (
  reps: number,
  {min, max}: {min: number; max: number | null},
): boolean => reps >= min && (max === null || reps <= max);

export function weekJumpConfirmation(
  current: ProgramState,
  {week, level}: Position,
) {
  const here = current.testDue ? '테스트 차례' : `Day ${current.day}`;
  const lines = [
    `지금 위치(${current.week}주차 ${here} · 레벨 ${current.level})는 사라져요. 운동 기록은 그대로 남아요.`,
  ];
  // 고른 주차·레벨의 기준이 최근 테스트 기록보다 높으면 알려준다
  const range = levelRange(week, level);
  if (range.min > current.lastTestReps) {
    lines.push(
      `이 주차·레벨은 최대 ${rangeText(
        range,
      )}를 기준으로 한 세트예요. 최근 테스트는 ${
        current.lastTestReps
      }개였어요.`,
    );
  }
  return {
    title: `${week}주차 · 레벨 ${level} · Day 1부터 다시 진행할까요?`,
    message: lines.join('\n\n'),
    confirmLabel: '이 주차로',
    cancelLabel: '취소',
  };
}

function ProgramTableScreen() {
  const navigation = useNavigation();
  const {user} = useSession();
  const programQuery = useQuery(currentProgramQueryOptions(user?.id ?? ''));
  const programRow = programQuery.data ?? null;
  const view = resolveProgramView(programQuery);
  const current =
    programRow && (view === 'active' || view === 'testDue')
      ? toProgramState(programRow)
      : null;
  const moveProgram = useUpdateProgramMutation();

  const [selectedLevel, setSelectedLevel] = useState<Level>();
  const [target, setTarget] = useState<Position>();
  const [jumpError, setJumpError] = useState(false);
  const level = selectedLevel ?? current?.level ?? 1;
  const table = programTable(level);

  const jump = (to: Position) => {
    setTarget(undefined);
    if (!programRow || !current || moveProgram.isPending) {
      return;
    }
    const moved = moveTo(current, to);
    moveProgram.mutate(
      {
        id: programRow.id,
        state: moved,
        // 이동 표시를 남겨 연속 실패가 여기서 끊기게 한다
        completedDay: moveRecord(moved, new Date().toISOString()),
        existing: programRow.completed_days,
      },
      {
        onSuccess: () =>
          navigation.dispatch(
            StackActions.popTo('Tabs', {
              screen: 'Program',
              params: {notice: jumpNotice(to)},
            }),
          ),
        onError: () => setJumpError(true),
      },
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title="전체 프로그램" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content}>
        <SegmentedControl
          options={levelTabs}
          value={String(level)}
          onChange={key =>
            setSelectedLevel(LEVELS.find(item => String(item) === key))
          }
        />
        <Text variant="caption" color="textMuted">
          매일 한 Day 씩, 한 주는 7일이에요.{'\n'}
          테스트 결과로 레벨이 정해져요.{'\n'}
          마지막 세트(+)는 최소 횟수 이상 가능한 만큼 해요.
          {current
            ? '\n‘여기서부터’를 누르면 그 주차·레벨의 Day 1부터 다시 진행할 수 있어요.'
            : ''}
        </Text>

        {table.map(week => {
          const isCurrentWeek =
            current?.level === level && current.week === week.week;
          const range = levelRange(week.week, level);
          const myRecord =
            current && inRange(current.lastTestReps, range)
              ? current.lastTestReps
              : null;
          return (
            <Card key={week.week} style={isCurrentWeek && styles.currentWeek}>
              <View style={styles.weekHeader}>
                <View style={styles.weekCopy}>
                  <Text variant="headline">{week.week}주차</Text>
                  <Text variant="caption" color="textMuted">
                    최대 {rangeText(range)} 기준
                  </Text>
                  {myRecord !== null && (
                    <Text variant="caption" color="active">
                      내 기록 {myRecord}개
                    </Text>
                  )}
                  {week.hasTest && (
                    <Text variant="caption" color="record">
                      끝나면 테스트
                    </Text>
                  )}
                </View>
                {isCurrentWeek ? (
                  <Text variant="label" color="active" style={styles.here}>
                    지금 여기 ·{' '}
                    {current.testDue ? '테스트 차례' : `Day ${current.day}`}
                  </Text>
                ) : current ? (
                  <Button
                    variant="text"
                    title="여기서부터"
                    disabled={moveProgram.isPending}
                    icon="chevron-right"
                    onPress={() => setTarget({week: week.week, day: 1, level})}
                  />
                ) : null}
              </View>
              {week.days.map(day => {
                const isCurrentDay =
                  isCurrentWeek && current.day === day.day && !current.testDue;
                return (
                  <View key={day.day} style={styles.dayRow}>
                    <Text
                      variant="label"
                      color={isCurrentDay ? 'active' : 'textMuted'}>
                      Day {day.day}
                    </Text>
                    <View style={styles.dayRight}>
                      <Text
                        variant="label"
                        color={isCurrentDay ? 'active' : 'text'}
                        weight={700}
                        style={styles.daySets}>
                        {day.sets}
                      </Text>
                      <Text variant="caption" color="textMuted">
                        합 {day.total} · 휴식 {day.restSeconds}초
                      </Text>
                    </View>
                  </View>
                );
              })}
            </Card>
          );
        })}

        <Text variant="caption" color="textMuted">
          테스트 결과가 다음 주차 기준에 못 미치면 같은 주차를 반복해요.{'\n'}
          그래서 걸리는 기간은 사람마다 달라요.
        </Text>
      </ScrollView>
      {current && target && (
        <ConfirmDialog
          visible
          {...weekJumpConfirmation(current, target)}
          onCancel={() => setTarget(undefined)}
          onConfirm={() => jump(target)}
        />
      )}
      {jumpError && (
        <ConfirmDialog
          visible
          title="주차를 바꾸지 못했어요"
          message="네트워크를 확인하고 다시 시도해 주세요."
          confirmLabel="확인"
          onCancel={() => setJumpError(false)}
          onConfirm={() => setJumpError(false)}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: color.bg},
  content: {padding: layout.screenPadding, gap: space[16]},
  currentWeek: {borderWidth: 1, borderColor: color.active},
  weekHeader: {flexDirection: 'row', alignItems: 'center', gap: space[8]},
  weekCopy: {flex: 1, gap: space[4]},
  here: {flexShrink: 1, textAlign: 'right'},
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[12],
    paddingTop: space[8],
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: color.border,
  },
  // 5·6주차의 긴 세트 문자열이 남은 폭에서 줄바꿈되게 한다
  dayRight: {flex: 1, alignItems: 'flex-end', gap: space[4]},
  daySets: {textAlign: 'right'},
});

export default ProgramTableScreen;
