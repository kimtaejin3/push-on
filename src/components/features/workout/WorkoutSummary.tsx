import React from 'react';
import {WorkoutPlan} from '../../../domain/workoutSession';
import {missedSets} from '../../../domain/hundredPushups';
import {ResultLayout} from '../result/ResultLayout';

interface WorkoutSummaryProps {
  plan: WorkoutPlan;
  results: number[];
  totalSeconds: number;
  /** 운동을 시작한 시각. 지난번·한 세트 최고는 이보다 앞선 기록과 비교한다 */
  beforeIso: string;
  /** 운동 중 세트 저장 상태 */
  setSaveStatus?: 'queued' | 'failed' | null;
  onDone: () => void;
  onHistory: () => void;
}

/** 세트 모드(자유 세트) 운동 요약 */
function WorkoutSummary({
  plan,
  results,
  totalSeconds,
  beforeIso,
  setSaveStatus,
  onDone,
  onHistory,
}: WorkoutSummaryProps) {
  const setCount = plan.sets.length;
  const reached = setCount - missedSets(plan.sets, results).length;
  const sameTarget = plan.sets.every(reps => reps === plan.sets[0]);
  // 목표가 모두 같으면 디자인 문구("목표 12개 × 5세트…"), 다르면 ResultLayout 의 총합 대비 문구
  const headline = sameTarget
    ? reached === setCount
      ? `목표 ${plan.sets[0]}개 × ${setCount}세트를 모두 채웠어요`
      : `목표 ${plan.sets[0]}개 × ${setCount}세트 중 ${reached}세트 채웠어요`
    : undefined;
  return (
    <ResultLayout
      mode="sets"
      beforeIso={beforeIso}
      completion={
        reached === setCount
          ? `자유 세트 · ${setCount}세트 모두 달성`
          : `자유 세트 · ${reached}/${setCount}세트 달성`
      }
      results={results}
      targets={plan.sets}
      lastIsMax={plan.lastIsMax}
      seconds={totalSeconds}
      headline={headline}
      setSaveStatus={setSaveStatus}
      action={{title: '확인', onPress: onDone}}
      onHistory={onHistory}
    />
  );
}

export default WorkoutSummary;
