import React from 'react';
import {Card} from '../../ui/Card';
import {Text} from '../../ui/Text';
import {
  describeSets,
  ProgramState,
  todayPlan,
} from '../../../domain/hundredPushups';
import {cardStyles as styles} from './cardStyles';

interface ProgramDoneTodayCardProps {
  kind: 'doneWorkout' | 'doneTest';
  next: ProgramState;
}

function ProgramDoneTodayCard({kind, next}: ProgramDoneTodayCardProps) {
  const plan = todayPlan(next);
  return (
    <Card>
      <Text variant="headline">
        {kind === 'doneWorkout' ? '오늘 운동 완료' : '오늘은 테스트를 했어요'}
      </Text>
      <Text color="textMuted">내일 이어서 해요</Text>
      <Text variant="label">
        내일 {next.week}주차 · Day {next.day} · 레벨 {next.level}
      </Text>
      <Text weight={800} style={styles.sets}>
        {describeSets(plan.sets, plan.lastIsMax)}
      </Text>
    </Card>
  );
}

export default ProgramDoneTodayCard;
