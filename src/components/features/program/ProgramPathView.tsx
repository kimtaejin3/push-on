import React, {type ReactNode} from 'react';
import {StyleSheet, View} from 'react-native';
import {color, radius, space} from '../../../theme';
import {WEEKS} from '../../../constants/hundredPushups';
import {
  todayPlan,
  type ProgramRecord,
  type ProgramState,
} from '../../../domain/hundredPushups';
import {programPath, type PathWeek} from '../../../domain/programPath';
import {Icon} from '../../ui/Icon';
import {PathNode} from '../../ui/PathNode';
import {Text} from '../../ui/Text';

interface ProgramPathViewProps {
  state: ProgramState;
  records: ProgramRecord[];
  initialTestReps: number | null;
  doneToday: boolean;
  children: ReactNode;
}

const nodeSize = 56;
const nodeGap = space[4];
const railWidth = 28;

function DayRow({cells}: {cells: PathWeek['cells']}) {
  return (
    <View style={styles.dayRow}>
      {cells.map(({day, status}, index) => (
        <React.Fragment key={day}>
          {index > 0 && (
            <View
              style={[
                styles.connector,
                status === 'done' && styles.connectorDone,
              ]}
            />
          )}
          <PathNode status={status} label={String(day)} size={nodeSize} />
        </React.Fragment>
      ))}
    </View>
  );
}

function TestFlag({
  label,
  highlighted,
  skipped,
  final,
}: {
  label: string;
  highlighted?: boolean;
  skipped?: boolean;
  final?: boolean;
}) {
  return (
    <View style={[styles.flagRow, skipped && styles.dimmed]}>
      <View style={styles.flagRail}>
        <Icon name={final ? 'trophy' : 'flag'} color="record" size={20} />
      </View>
      <View style={[styles.flagLabel, highlighted && styles.flagHighlighted]}>
        <Text
          variant="label"
          color={highlighted ? 'record' : 'textMuted'}
          weight={700}>
          {label}
        </Text>
      </View>
    </View>
  );
}

export default function ProgramPathView({
  state,
  records,
  initialTestReps,
  doneToday,
  children,
}: ProgramPathViewProps) {
  const {passed, total, weeks} = programPath(state, records);
  const reps = todayPlan(state).sets.reduce((sum, set) => sum + set, 0);

  return (
    <>
      <View style={styles.summary}>
        <View style={styles.summaryHeading}>
          <Text
            variant="hero"
            weight={900}
            color="active"
            style={styles.passed}>
            {passed}
          </Text>
          <Text variant="headline">/ {total}칸 지났어요</Text>
        </View>
        <View
          accessibilityRole="progressbar"
          accessibilityLabel="챌린지 진행 칸"
          accessibilityValue={{min: 0, max: total, now: passed}}
          style={styles.progress}>
          {Array.from({length: total}, (_, index) => (
            <View
              key={index}
              style={[
                styles.segment,
                index < passed && styles.segmentDone,
                index === passed && !state.testDue && styles.segmentCurrent,
              ]}
            />
          ))}
        </View>
        <Text variant="label" color="textMuted" weight={500}>
          {initialTestReps === null ? '' : `처음 ${initialTestReps}개 → `}
          지난 테스트 {state.lastTestReps}개
        </Text>
      </View>

      {children}

      <View style={styles.path}>
        <View style={styles.rail} />
        <TestFlag
          label={
            initialTestReps === null
              ? '시작 테스트'
              : `시작 테스트  ${initialTestReps}개`
          }
          highlighted
        />
        {weeks.map(({week, cells, test}) => {
          const current = week === state.week;
          const skipped = cells.every(cell => cell.status === 'skipped');
          const done = cells.every(cell => cell.status === 'done');
          const weekTone = current ? 'active' : done ? 'text' : 'textMuted';
          const status = skipped
            ? '건너뜀'
            : current && state.testDue
            ? '테스트 차례'
            : current
            ? `${doneToday ? '내일' : '오늘'}\n${reps}개`
            : done
            ? '완료'
            : null;

          return (
            <React.Fragment key={week}>
              <View
                style={[
                  styles.week,
                  current && styles.currentWeek,
                  skipped && styles.dimmed,
                ]}>
                {current && <View style={[styles.rail, styles.activeRail]} />}
                <View
                  style={[styles.weekRail, current && styles.currentWeekLabel]}>
                  <Text
                    variant="headline"
                    numeric
                    weight={800}
                    color={weekTone}
                    style={styles.weekNumber}>
                    {week}
                  </Text>
                  <Text
                    color="textMuted"
                    weight={700}
                    style={styles.weekSuffix}>
                    주차
                  </Text>
                </View>
                <View style={styles.grid}>
                  <DayRow cells={cells.slice(0, 4)} />
                  <DayRow cells={cells.slice(4)} />
                </View>
                {status && (
                  <Text
                    variant="caption"
                    color={current ? 'active' : 'textMuted'}
                    weight={700}
                    style={styles.status}>
                    {status}
                  </Text>
                )}
              </View>
              {test !== 'none' && (
                <TestFlag
                  label={
                    week === WEEKS ? '최종 테스트  100개' : `${week}주차 테스트`
                  }
                  highlighted={test === 'done' || test === 'current'}
                  skipped={test === 'skipped'}
                  final={week === WEEKS}
                />
              )}
            </React.Fragment>
          );
        })}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  summary: {gap: space[12]},
  summaryHeading: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    gap: space[8],
  },
  passed: {fontSize: 64, lineHeight: 58},
  progress: {flexDirection: 'row', gap: 2},
  segment: {flex: 1, height: 8, borderRadius: 2, backgroundColor: color.border},
  segmentDone: {backgroundColor: color.active},
  segmentCurrent: {backgroundColor: color.activeDim},
  path: {gap: space[4]},
  rail: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: railWidth / 2 - 1,
    width: 2,
    backgroundColor: color.border,
  },
  activeRail: {backgroundColor: color.active},
  week: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    columnGap: space[4],
    paddingVertical: space[8],
  },
  currentWeek: {backgroundColor: color.surface, borderRadius: radius.l},
  weekRail: {
    width: railWidth,
    alignItems: 'center',
    paddingVertical: space[4],
    backgroundColor: color.bg,
  },
  currentWeekLabel: {backgroundColor: color.surface},
  weekNumber: {fontSize: 26, lineHeight: 29},
  weekSuffix: {fontSize: 10, lineHeight: 13},
  grid: {gap: space[8]},
  dayRow: {flexDirection: 'row', alignItems: 'center'},
  connector: {width: nodeGap, height: 2, backgroundColor: color.border},
  connectorDone: {backgroundColor: color.active},
  status: {width: 52, flexGrow: 1, textAlign: 'right', paddingRight: space[4]},
  dimmed: {opacity: 0.55},
  flagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[4],
    minHeight: 56,
  },
  flagRail: {
    width: railWidth,
    alignItems: 'center',
    paddingVertical: space[4],
    backgroundColor: color.bg,
  },
  flagLabel: {
    flexShrink: 1,
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: radius.pill,
    minHeight: 36,
    justifyContent: 'center',
    paddingVertical: space[4],
    paddingHorizontal: space[12],
  },
  flagHighlighted: {
    backgroundColor: `${color.record}1F`,
    borderColor: `${color.record}66`,
  },
});
