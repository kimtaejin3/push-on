import React from 'react';
import {Text, View} from 'react-native';
import CustomButton from '../../common/CustomButton';
import {
  describeSets,
  describeSetsAt,
  DOWNGRADE_AFTER,
  downgradeTarget,
  failStreak,
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
  onStart: () => void;
  onRetest: () => void;
  onOpenTable: () => void;
  onDowngrade: () => void;
  downgradePending: boolean;
  downgradeError: boolean;
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
  onStart,
  onRetest,
  onOpenTable,
  onDowngrade,
  downgradePending,
  downgradeError,
}: ProgramTodayCardProps) {
  const plan = todayPlan(state);
  const failure = lastFailure(records, state);
  const streak = failStreak(records, state);
  const target = downgradeTarget(state);
  const stuck = streak >= DOWNGRADE_AFTER;
  const offer = stuck && target !== null;
  const missed = failure ? missedSets(failure.targets ?? plan.sets, failure.reps) : [];

  return (
    <View style={styles.card}>
      {failure ? (
        <View style={styles.callout}>
          <Text style={styles.calloutTitle}>
            지난번({monthDay(failure.completed_at)})에 세트 {missed.map(m => m.set).join('·')}에서 목표를 못
            채워서 Day {withJosa(state.day, '을')} 다시 해요
          </Text>
          {missed.map(m => (
            <Text key={m.set} style={styles.calloutRow}>
              세트 {m.set} · {m.reps} / {m.target} ({m.short}개 부족)
            </Text>
          ))}
        </View>
      ) : null}

      <Text style={styles.heading}>
        {state.week}주차 · Day {state.day} · 레벨 {state.level}
      </Text>
      <Text style={styles.sets}>{describeSets(plan.sets, plan.lastIsMax)}</Text>
      <Text style={styles.body}>세트 사이 휴식 {plan.restSeconds}초 · 마지막 세트는 가능한 만큼</Text>
      <Text style={styles.emphasis}>모든 세트를 채우면 다음({nextStepLabel(state)})으로 넘어가요</Text>

      {offer && target ? (
        <>
          <View style={styles.callout}>
            <Text style={styles.calloutTitle}>
              Day {withJosa(state.day, '을')} {streak === 2 ? '두 ' : streak}번 연속 못 채웠어요.{' '}
              {target.week === state.week
                ? `지금 레벨(${state.level})이 조금 버거울 수 있어요.`
                : `${state.week}주차가 지금은 조금 버거울 수 있어요.`}
            </Text>
            <Text style={styles.hint}>
              {target.week === state.week
                ? `레벨 ${withJosa(target.level, '으로')} 낮추면 오늘 세트는 ${describeSetsAt(target)} 예요`
                : `${target.week}주차 Day ${target.day}부터 다시 하면 ${describeSetsAt(target)} 예요`}
            </Text>
          </View>
          {downgradeError ? (
            <Text style={styles.warning}>레벨을 바꾸지 못했어요. 네트워크를 확인해 주세요.</Text>
          ) : null}
          <CustomButton
            title={
              downgradePending
                ? '바꾸는 중…'
                : target.week === state.week
                ? `레벨 ${withJosa(target.level, '으로')} 낮추기`
                : '이전 주차로 돌아가기'
            }
            variant="start"
            disabled={downgradePending}
            style={[styles.button, downgradePending && styles.disabled]}
            onPress={onDowngrade}
          />
          <Text style={styles.link} onPress={downgradePending ? undefined : onStart}>
            이 레벨로 한 번 더
          </Text>
        </>
      ) : (
        <>
          {stuck ? (
            <Text style={styles.hint}>
              Day {withJosa(state.day, '을')} {streak === 2 ? '두 ' : streak}번 연속 못 채웠어요. 지금이 가장 쉬운
              단계라 같은 Day를 다시 해요.
            </Text>
          ) : null}
          <CustomButton title="오늘 운동 시작" variant="start" style={styles.button} onPress={onStart} />
        </>
      )}

      <Text style={styles.link} onPress={onRetest}>
        레벨 다시 재기
      </Text>
      <Text style={styles.link} onPress={onOpenTable}>
        전체 세트 보기 · 주차 바꾸기
      </Text>
    </View>
  );
}

export default ProgramTodayCard;
