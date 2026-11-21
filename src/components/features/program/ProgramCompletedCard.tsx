import React from 'react';
import {StyleSheet, View} from 'react-native';
import {
  passedDayCount,
  type ProgramRecord,
} from '../../../domain/hundredPushups';
import {color, space} from '../../../theme';
import {Text} from '../../ui/Text';
import MilestoneScreen from './MilestoneScreen';

interface ProgramCompletedCardProps {
  initialTestReps: number | null;
  lastTestReps: number;
  startedAt: string;
  finishedAt: string;
  records: ProgramRecord[];
  onRestart: () => void;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** 시작일과 완료일을 모두 포함한 일수. 날짜를 읽을 수 없으면 null */
const daysBetween = (startedAt: string, finishedAt: string): number | null => {
  const span = new Date(finishedAt).getTime() - new Date(startedAt).getTime();
  return Number.isFinite(span) && span >= 0
    ? Math.floor(span / DAY_MS) + 1
    : null;
};

function Fact({label, value}: {label: string; value: string}) {
  return (
    <View style={styles.fact}>
      <Text color="textMuted" style={styles.label}>
        {label}
      </Text>
      <Text weight={700} style={styles.value}>
        {value}
      </Text>
    </View>
  );
}

function ProgramCompletedCard({
  initialTestReps,
  lastTestReps,
  startedAt,
  finishedAt,
  records,
  onRestart,
}: ProgramCompletedCardProps) {
  const days = daysBetween(startedAt, finishedAt);
  const passedDays = passedDayCount(records);
  const totalReps = records.reduce(
    (sum, record) =>
      record.kind === undefined
        ? record.reps.reduce((total, reps) => total + reps, sum)
        : sum,
    0,
  );

  return (
    <MilestoneScreen onRestart={onRestart}>
      <View style={styles.facts}>
        {initialTestReps !== null && (
          <Fact
            label="처음 테스트 → 오늘"
            value={`${initialTestReps}개 → ${lastTestReps}개`}
          />
        )}
        {days === null ? (
          <Fact label="통과한 운동" value={`${passedDays}일`} />
        ) : (
          <Fact label="걸린 시간" value={`${days}일 · 통과 ${passedDays}일`} />
        )}
        <Fact
          label="챌린지 동안 한 푸쉬업"
          value={`총 ${totalReps.toLocaleString('ko-KR')}개`}
        />
      </View>
    </MilestoneScreen>
  );
}

const styles = StyleSheet.create({
  facts: {alignSelf: 'stretch'},
  fact: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space[8],
    minHeight: 52,
    paddingVertical: space[8],
    borderBottomWidth: 1,
    borderBottomColor: color.border,
  },
  label: {flex: 1},
  value: {flexShrink: 1, textAlign: 'right'},
});

export default ProgramCompletedCard;
