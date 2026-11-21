import React from 'react';
import {View} from 'react-native';
import {Button} from '../../ui/Button';
import {Card} from '../../ui/Card';
import {Text} from '../../ui/Text';
import {
  describeSets,
  describeSetsAt,
  DOWNGRADE_AFTER,
  Position,
  lastFailure,
  missedSets,
  ProgramRecord,
  ProgramState,
  todayPlan,
} from '../../../domain/hundredPushups';
import {nextStepLabel, withJosa} from '../../../domain/programMessages';
import {cardStyles as styles} from './cardStyles';

interface ProgramTodayCardProps {
  state: ProgramState;
  records: ProgramRecord[];
  streak: number;
  downgrade: Position | null;
  onDowngrade: () => void;
  downgradePending: boolean;
  downgradeError: boolean;
  disabled: boolean;
}

const monthDay = (iso: string): string => {
  const d = new Date(iso);
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
};

/**
 * 오늘 할 운동 카드. 레벨·통과 조건을 항상 보여주고,
 * 지난 시도가 실패였으면 왜 같은 Day 를 다시 하는지, 연속 실패면 하향 권유를 함께 보여준다.
 */
function ProgramTodayCard({
  state,
  records,
  streak,
  downgrade,
  onDowngrade,
  downgradePending,
  downgradeError,
  disabled,
}: ProgramTodayCardProps) {
  const plan = todayPlan(state);
  const failure = lastFailure(records, state);
  const stuck = streak >= DOWNGRADE_AFTER;
  const missed = failure
    ? missedSets(failure.targets ?? plan.sets, failure.reps)
    : [];

  return (
    <Card>
      {failure ? (
        <View style={styles.callout}>
          <Text variant="label" weight={700}>
            지난번({monthDay(failure.completed_at)})에 세트{' '}
            {missed.map(m => m.set).join('·')}에서 목표를 못 채워서 Day{' '}
            {withJosa(state.day, '을')} 다시 해요
          </Text>
          {missed.map(m => (
            <Text key={m.set} variant="label" color="record">
              세트 {m.set} · {m.reps} / {m.target} ({m.short}개 부족)
            </Text>
          ))}
        </View>
      ) : null}

      <Text variant="headline">
        {state.week}주차 · Day {state.day} · 레벨 {state.level}
      </Text>
      <Text weight={800} style={styles.sets}>
        {describeSets(plan.sets, plan.lastIsMax)}
      </Text>
      <Text color="textMuted">
        세트 사이 휴식 {plan.restSeconds}초 · 마지막 세트는 가능한 만큼
      </Text>
      <Text variant="label">
        모든 세트를 채우면 다음({nextStepLabel(state)})으로 넘어가요
      </Text>

      {downgrade ? (
        <>
          <View style={styles.callout}>
            <Text variant="label" weight={700}>
              Day {withJosa(state.day, '을')} {streak === 2 ? '두 ' : streak}번
              연속 못 채웠어요.{' '}
              {downgrade.week === state.week
                ? `지금 레벨(${state.level})이 조금 버거울 수 있어요.`
                : `${state.week}주차가 지금은 조금 버거울 수 있어요.`}
            </Text>
            <Text variant="caption" color="textMuted">
              {downgrade.week === state.week
                ? `레벨 ${withJosa(
                    downgrade.level,
                    '으로',
                  )} 낮추면 오늘 세트는 ${describeSetsAt(downgrade)} 예요`
                : `${downgrade.week}주차 Day ${
                    downgrade.day
                  }부터 다시 하면 ${describeSetsAt(downgrade)} 예요`}
            </Text>
          </View>
          {downgradeError ? (
            <Text variant="caption" color="alert">
              레벨을 바꾸지 못했어요. 네트워크를 확인해 주세요.
            </Text>
          ) : null}
          <Button
            title={
              downgradePending
                ? '바꾸는 중…'
                : downgrade.week === state.week
                ? `레벨 ${withJosa(downgrade.level, '으로')} 낮추기`
                : '이전 주차로 돌아가기'
            }
            variant="secondary"
            disabled={disabled}
            loading={downgradePending}
            onPress={onDowngrade}
          />
        </>
      ) : stuck ? (
        <Text variant="caption" color="textMuted">
          Day {withJosa(state.day, '을')} {streak === 2 ? '두 ' : streak}번 연속
          못 채웠어요. 지금이 가장 쉬운 단계라 같은 Day를 다시 해요.
        </Text>
      ) : null}
    </Card>
  );
}

export default ProgramTodayCard;
