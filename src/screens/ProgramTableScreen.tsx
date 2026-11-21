import React, {useState} from 'react';
import {Alert, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {StackActions, useNavigation} from '@react-navigation/native';
import {useQuery} from '@tanstack/react-query';
import Header from '../components/common/Header';
import {colors} from '../constants/colors';
import {useSession} from '../hooks/useSession';
import {currentProgramQueryOptions, useUpdateProgramMutation} from '../tanstack-query';
import {toProgramState} from '../remote/program';
import {Level, levelRange, moveRecord, moveTo, Position, programTable} from '../domain/hundredPushups';
import {jumpNotice} from '../domain/programMessages';
import {resolveProgramView} from '../domain/programView';

const LEVELS: Level[] = [1, 2, 3];

// 1주차 레벨 1 처럼 min 이 0 이면 "0~5개" 대신 "5개 이하"로 읽히게 한다
const rangeText = ({min, max}: {min: number; max: number | null}): string =>
  max === null ? `${min}개 이상` : min === 0 ? `${max}개 이하` : `${min}~${max}개`;

const inRange = (reps: number, {min, max}: {min: number; max: number | null}): boolean =>
  reps >= min && (max === null || reps <= max);

/**
 * 주차·레벨별 전체 세트 표.
 * 프로그램을 진행 중이면 여기서 주차·레벨을 직접 골라 그 주차의 Day 1부터 다시 진행할 수 있다.
 */
function ProgramTableScreen() {
  const navigation = useNavigation();
  const {user} = useSession();
  const programQuery = useQuery(currentProgramQueryOptions(user?.id ?? ''));
  const programRow = programQuery.data ?? null;
  const view = resolveProgramView(programQuery);
  const canJump = (view === 'active' || view === 'testDue') && programRow !== null;
  const current = canJump && programRow ? toProgramState(programRow) : null;
  const moveProgram = useUpdateProgramMutation();

  const [level, setLevel] = useState<Level>(current?.level ?? 1);
  const table = programTable(level);
  const isCurrentLevel = current?.level === level;

  const jump = (to: Position) => {
    if (!programRow || !current) {
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
        onSuccess: () => navigation.dispatch(StackActions.popTo('Program', {notice: jumpNotice(to)})),
        onError: () => Alert.alert('주차를 바꾸지 못했어요', '네트워크를 확인하고 다시 시도해 주세요.'),
      },
    );
  };

  const confirmJump = (week: number) => {
    if (!current) {
      return;
    }
    const to: Position = {week, day: 1, level};
    const here = current.testDue ? '테스트 차례' : `Day ${current.day}`;
    const lines = [
      `지금 위치(${current.week}주차 ${here} · 레벨 ${current.level})는 사라져요. 운동 기록은 그대로 남아요.`,
    ];
    // 고른 주차·레벨의 기준이 최근 테스트 기록보다 높으면 알려준다 (막지는 않는다)
    const range = levelRange(week, level);
    if (range.min > current.lastTestReps) {
      lines.push(
        `이 주차·레벨은 최대 ${rangeText(range)}를 기준으로 한 세트예요. 최근 테스트는 ${current.lastTestReps}개였어요.`,
      );
    }
    Alert.alert(`${week}주차 · 레벨 ${level} · Day 1부터 다시 진행할까요?`, lines.join('\n\n'), [
      {text: '취소', style: 'cancel'},
      {text: '이 주차로', onPress: () => jump(to)},
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header title="전체 프로그램" onBackPress={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.segments}>
          {LEVELS.map(l => {
            const active = level === l;
            return (
              <TouchableOpacity
                key={l}
                style={[styles.segment, active && styles.segmentActive]}
                onPress={() => setLevel(l)}>
                <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
                  레벨 {l}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <Text style={styles.caption}>
          매일 한 Day 씩, 한 주는 7일이에요.{'\n'}테스트 결과로 레벨이 정해져요.{'\n'}마지막 세트(+)는 최소 횟수 이상 가능한 만큼 해요.
          {canJump ? '\n‘여기서부터’를 누르면 그 주차·레벨의 Day 1부터 다시 진행할 수 있어요.' : ''}
        </Text>

        {table.map(week => {
          const isCurrentWeek = isCurrentLevel && current?.week === week.week;
          const range = levelRange(week.week, level);
          // 주차마다 레벨 범위가 겹치지 않아 최근 기록은 한 레벨 탭에만 표시된다
          const myRecord = current && inRange(current.lastTestReps, range) ? current.lastTestReps : null;
          return (
            <View key={week.week} style={[styles.weekCard, isCurrentWeek && styles.weekCardCurrent]}>
              <View style={styles.weekHeader}>
                <View style={styles.weekTitleRow}>
                  <Text style={styles.weekTitle}>{week.week}주차</Text>
                  <Text style={styles.weekRange}>
                    최대 {rangeText(range)} 기준
                    {myRecord !== null && <Text style={styles.myRecord}> · 내 기록 {myRecord}개</Text>}
                  </Text>
                  {week.hasTest && <Text style={styles.testBadge}>끝나면 테스트</Text>}
                </View>
                {isCurrentWeek && current ? (
                  <Text style={styles.here}>
                    지금 여기 · {current.testDue ? '테스트 차례' : `Day ${current.day}`}
                  </Text>
                ) : canJump ? (
                  <TouchableOpacity
                    style={[styles.jump, moveProgram.isPending && styles.jumpDisabled]}
                    disabled={moveProgram.isPending}
                    hitSlop={8}
                    onPress={() => confirmJump(week.week)}>
                    <Text style={styles.jumpText}>여기서부터</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
              {week.days.map(day => {
                const isCurrentDay = isCurrentWeek && current?.day === day.day && !current?.testDue;
                return (
                  <View key={day.day} style={styles.dayRow}>
                    <Text style={[styles.dayLabel, isCurrentDay && styles.currentText]}>
                      Day {day.day}
                      {isCurrentDay ? ' ·' : ''}
                    </Text>
                    <View style={styles.dayRight}>
                      <Text style={[styles.daySets, isCurrentDay && styles.currentText]}>
                        {day.sets}
                      </Text>
                      <Text style={styles.dayRest}>
                        합 {day.total} · 휴식 {day.restSeconds}초
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          );
        })}

        <Text style={styles.caption}>
          테스트 결과가 다음 주차 기준에 못 미치면 같은 주차를 반복해요.{'\n'}그래서 걸리는 기간은 사람마다 달라요.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.backgroundDark},
  content: {padding: 20, gap: 12, paddingBottom: 40},
  segments: {
    flexDirection: 'row',
    backgroundColor: colors.overlayLight,
    borderRadius: 12,
    padding: 4,
  },
  segment: {flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center'},
  segmentActive: {backgroundColor: colors.primaryDark},
  segmentText: {fontSize: 14, fontWeight: '600', color: colors.textSecondary},
  segmentTextActive: {color: colors.textLight},
  caption: {fontSize: 13, lineHeight: 19, color: colors.gray400},
  weekCard: {
    backgroundColor: colors.overlayLight,
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  weekCardCurrent: {borderWidth: 1, borderColor: colors.primary},
  weekHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
    minHeight: 32,
  },
  // 기준·내 기록·테스트 표시가 길어지면 오른쪽 버튼을 밀지 않고 다음 줄로 넘긴다
  weekTitleRow: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    columnGap: 8,
    rowGap: 2,
    marginRight: 8,
  },
  weekTitle: {fontSize: 16, fontWeight: '600', color: colors.textLight},
  weekRange: {fontSize: 12, color: colors.gray400},
  myRecord: {color: colors.primaryLight, fontWeight: '600'},
  testBadge: {fontSize: 12, color: colors.primaryLight},
  here: {fontSize: 13, fontWeight: '600', color: colors.primaryLight},
  jump: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.primaryLight,
  },
  jumpDisabled: {opacity: 0.4},
  jumpText: {fontSize: 13, fontWeight: '600', color: colors.primaryLight},
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  dayLabel: {fontSize: 14, color: colors.textSecondary, marginRight: 12},
  // 5·6주차는 8~9세트라 세트 문자열이 좁은 화면에서 줄바꿈되도록 남은 폭을 준다
  dayRight: {flex: 1, alignItems: 'flex-end', gap: 2},
  daySets: {fontSize: 15, fontWeight: '600', color: colors.textLight, textAlign: 'right'},
  dayRest: {fontSize: 12, color: colors.gray400},
  currentText: {color: colors.primaryLight},
});

export default ProgramTableScreen;
