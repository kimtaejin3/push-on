import React from 'react';
import {describeSetsAt, DOWNGRADE_AFTER, missedSets, Position} from '../../../domain/hundredPushups';
import {withJosa} from '../../../domain/programMessages';
import {NextWorkout, ResultLayout} from '../result/ResultLayout';

interface ProgramDaySummaryProps {
  /** 이 운동을 한 위치 */
  position: Position;
  targets: number[];
  results: number[];
  totalSeconds: number;
  /** 운동을 시작한 시각. 지난번·한 세트 최고는 이보다 앞선 기록과 비교한다 */
  beforeIso: string;
  /** 운동 중 세트 저장 상태 */
  setSaveStatus?: 'queued' | 'failed' | null;
  passed: boolean;
  /** 이번 시도를 포함한 연속 실패 횟수 */
  streak: number;
  /** 이 날을 통과한 뒤 할 일 ("2주차 Day 3" | "2주차 테스트") */
  nextLabel: string;
  /** 낮출 수 있는 곳. 없으면(1주차 레벨 1) null. 권유는 streak 가 기준 이상일 때만 한다 */
  downgrade: Position | null;
  /** 운동 결과 저장 상태 */
  save: {pending: boolean; error: boolean; onRetry: () => void};
  /** 하향 저장 상태 */
  move: {pending: boolean; error: boolean};
  onDone: () => void;
  onDowngrade: () => void;
  onHistory: () => void;
}

/**
 * 100개 챌린지 운동 요약: 판정 → 세트별 결과 → 왜 이렇게 됐고 다음에 뭘 하면 되는지.
 */
function ProgramDaySummary({
  position,
  targets,
  results,
  totalSeconds,
  beforeIso,
  setSaveStatus,
  passed,
  streak,
  nextLabel,
  downgrade,
  save,
  move,
  onDone,
  onDowngrade,
  onHistory,
}: ProgramDaySummaryProps) {
  const {week, day, level} = position;
  const missed = missedSets(targets, results);
  const offerDowngrade = !passed && streak >= DOWNGRADE_AFTER && downgrade !== null;
  const busy = save.pending || move.pending;

  const title = passed
    ? `${week}주차 Day ${day} 통과`
    : streak >= DOWNGRADE_AFTER
    ? `${week}주차 Day ${day} · ${streak === 2 ? '두 ' : streak}번 연속 못 채웠어요`
    : `${week}주차 Day ${day} · 한 번 더`;

  const subtitle = passed
    ? '모든 세트를 채웠어요'
    : `세트 ${missed.map(m => m.set).join('·')}에서 목표에 못 미쳤어요`;

  // 못 채웠을 때: 왜 같은 Day 를 다시 하는지와 다음에 무엇을 권할지
  const guide = (): string => {
    const rule = `모든 세트를 채워야 다음(${nextLabel})으로 넘어가요.`;
    if (offerDowngrade && downgrade) {
      return downgrade.week === week
        ? `${rule}\n지금 레벨(${level})이 조금 버거울 수 있어요.\n레벨 ${withJosa(downgrade.level, '으로')} 낮추면 Day ${withJosa(day, '은')} ${describeSetsAt(downgrade)} 예요.`
        : `${rule}\n${week}주차가 지금은 조금 버거울 수 있어요.\n${downgrade.week}주차 Day ${downgrade.day}부터 다시 하면 ${describeSetsAt(downgrade)} 예요.`;
    }
    if (!downgrade) {
      return `${rule}\n지금이 가장 쉬운 단계예요. 다음 운동도 Day ${withJosa(day, '을')} 다시 해요.`;
    }
    const nextOffer = downgrade.week === week ? '레벨을 낮추는 걸' : '이전 주차로 돌아가는 걸';
    return `${rule} 다음 운동도 Day ${withJosa(day, '이에요')}.\n한 번 더 못 채우면 ${nextOffer} 권할게요.`;
  };

  const nextCard = passed
    ? nextLabel.endsWith('테스트')
      ? {title: `다음 · ${nextLabel}`, detail: '충분히 쉰 날에 재는 걸 권해요.'}
      : {title: `다음 운동 · 내일 ${nextLabel}`, detail: undefined}
    : {title: `다음 운동도 ${week}주차 Day ${day}`, detail: guide()};

  const actions = (): Pick<
    React.ComponentProps<typeof ResultLayout>,
    'action' | 'secondaryAction' | 'warning' | 'onHistory'
  > => {
    if (save.error) {
      // 반영이 안 됐으면 떠나지 않고 다시 시도하게 한다
      return {
        warning: '운동 결과를 저장하지 못했어요. 네트워크를 확인해 주세요.',
        action: {title: '다시 시도', onPress: save.onRetry},
      };
    }
    if (offerDowngrade && downgrade) {
      return {
        warning: move.error ? '레벨을 바꾸지 못했어요. 네트워크를 확인해 주세요.' : undefined,
        action: {
          title:
            downgrade.week === week
              ? `레벨 ${withJosa(downgrade.level, '으로')} 낮추기`
              : '이전 주차로 돌아가기',
          onPress: onDowngrade,
          loading: move.pending,
          disabled: busy,
        },
        secondaryAction: {title: '이 레벨로 한 번 더', onPress: onDone, disabled: busy},
        onHistory,
      };
    }
    return {
      action: {title: '확인', onPress: onDone, loading: save.pending, disabled: busy},
      onHistory,
    };
  };

  return (
    <ResultLayout
      mode="program"
      beforeIso={beforeIso}
      completion={title}
      neutral={!passed}
      results={results}
      targets={targets}
      lastIsMax
      seconds={totalSeconds}
      headline={passed ? undefined : subtitle}
      setSaveStatus={setSaveStatus}
      {...actions()}>
      <NextWorkout title={nextCard.title} detail={nextCard.detail} />
    </ResultLayout>
  );
}

export default ProgramDaySummary;
