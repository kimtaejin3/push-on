import React from 'react';
import {SafeAreaView} from 'react-native-safe-area-context';
import {ScrollView, StyleSheet, Text, View} from 'react-native';
import CustomButton from '../../common/CustomButton';
import {colors} from '../../../constants/colors';
import {describeSetsAt, DOWNGRADE_AFTER, missedSets, Position} from '../../../domain/hundredPushups';
import {formatTime} from '../../../utils/time';

interface ProgramDaySummaryProps {
  /** 이 운동을 한 위치 */
  position: Position;
  targets: number[];
  results: number[];
  totalSeconds: number;
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
}

/**
 * 100개 챌린지 운동 요약: 판정 → 세트별 결과 → 왜 이렇게 됐고 다음에 뭘 하면 되는지.
 */
function ProgramDaySummary({
  position,
  targets,
  results,
  totalSeconds,
  passed,
  streak,
  nextLabel,
  downgrade,
  save,
  move,
  onDone,
  onDowngrade,
}: ProgramDaySummaryProps) {
  const {week, day, level} = position;
  const total = results.reduce((a, b) => a + b, 0);
  const missed = missedSets(targets, results);
  const offerDowngrade = !passed && streak >= DOWNGRADE_AFTER && downgrade !== null;
  const busy = save.pending || move.pending;

  const title = passed
    ? `${week}주차 Day ${day} 통과`
    : streak >= DOWNGRADE_AFTER
    ? `${week}주차 Day ${day} · ${streak === 2 ? '두' : streak}번 연속 못 채웠어요`
    : `${week}주차 Day ${day} · 한 번 더`;

  const subtitle = passed
    ? '모든 세트를 채웠어요'
    : `세트 ${missed.map(m => m.set).join('·')}에서 목표에 못 미쳤어요`;

  const guide = (): string => {
    if (passed) {
      return nextLabel.endsWith('테스트')
        ? `다음은 ${nextLabel}예요. 충분히 쉰 날에 재는 걸 권해요.`
        : `다음은 ${nextLabel} · 하루 쉬고 하는 걸 권해요.`;
    }
    const rule = `모든 세트를 채워야 다음(${nextLabel})으로 넘어가요.`;
    if (offerDowngrade && downgrade) {
      return downgrade.week === week
        ? `${rule}\n지금 레벨(${level})이 조금 버거울 수 있어요.\n레벨 ${downgrade.level}로 낮추면 Day ${day}는 ${describeSetsAt(downgrade)} 예요.`
        : `${rule}\n${week}주차가 지금은 조금 버거울 수 있어요.\n${downgrade.week}주차 Day ${downgrade.day}부터 다시 하면 ${describeSetsAt(downgrade)} 예요.`;
    }
    if (!downgrade) {
      return `${rule}\n지금이 가장 쉬운 단계예요. 다음 운동도 Day ${day}를 다시 해요.`;
    }
    return `${rule} 다음 운동도 Day ${day}예요.\n한 번 더 못 채우면 레벨을 낮추는 걸 권할게요.`;
  };

  const renderActions = () => {
    if (save.error) {
      return (
        <>
          <Text style={styles.warning}>운동 결과를 저장하지 못했어요. 네트워크를 확인해 주세요.</Text>
          <CustomButton title="다시 시도" variant="start" style={styles.button} onPress={save.onRetry} />
        </>
      );
    }
    if (offerDowngrade && downgrade) {
      return (
        <>
          {move.error ? (
            <Text style={styles.warning}>레벨을 바꾸지 못했어요. 네트워크를 확인해 주세요.</Text>
          ) : null}
          <CustomButton
            title={
              move.pending
                ? '바꾸는 중…'
                : downgrade.week === week
                ? `레벨 ${downgrade.level}로 낮추기`
                : '이전 주차로 돌아가기'
            }
            variant="start"
            disabled={busy}
            style={[styles.button, busy && styles.disabled]}
            onPress={onDowngrade}
          />
          <Text style={styles.secondary} onPress={busy ? undefined : onDone}>
            이 레벨로 한 번 더
          </Text>
        </>
      );
    }
    return (
      <CustomButton
        title={save.pending ? '저장 중…' : '프로그램으로'}
        variant="start"
        disabled={busy}
        style={[styles.button, busy && styles.disabled]}
        onPress={onDone}
      />
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>

        <View style={styles.table}>
          {targets.map((target, i) => {
            const reps = results[i] ?? 0;
            const short = target - reps;
            const isMax = i === targets.length - 1;
            return (
              <View key={i} style={styles.row}>
                <Text style={styles.rowLabel}>세트 {i + 1}</Text>
                <View style={styles.rowRight}>
                  {short > 0 ? <Text style={styles.rowShort}>−{short}</Text> : null}
                  <Text style={[styles.rowValue, short > 0 && styles.rowValueMissed]}>
                    {reps} / {target}
                    {isMax ? '+' : ''}
                  </Text>
                </View>
              </View>
            );
          })}
          <View style={[styles.row, styles.totalRow]}>
            <Text style={styles.rowLabel}>
              총 {total}개 · {formatTime(totalSeconds)}
            </Text>
          </View>
        </View>

        <Text style={styles.guide}>{guide()}</Text>
        {renderActions()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {flex: 1, backgroundColor: colors.backgroundDark},
  content: {padding: 20, gap: 20},
  header: {alignItems: 'center', marginTop: 32, gap: 8},
  title: {fontSize: 24, fontWeight: 'bold', color: colors.textLight, textAlign: 'center'},
  subtitle: {fontSize: 15, color: colors.gray400, textAlign: 'center'},
  table: {backgroundColor: colors.overlayLight, borderRadius: 16, paddingHorizontal: 20, paddingVertical: 8},
  row: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12},
  totalRow: {borderTopWidth: 1, borderTopColor: colors.overlayMedium},
  rowLabel: {fontSize: 16, color: colors.gray400},
  rowRight: {flexDirection: 'row', alignItems: 'center', gap: 10},
  rowValue: {fontSize: 16, fontWeight: '600', color: colors.textLight},
  rowValueMissed: {color: colors.warning},
  rowShort: {fontSize: 14, fontWeight: '600', color: colors.warning},
  guide: {fontSize: 15, lineHeight: 23, color: colors.textLight, textAlign: 'center'},
  warning: {fontSize: 13, color: colors.error, textAlign: 'center'},
  button: {marginTop: 4},
  disabled: {opacity: 0.6},
  secondary: {fontSize: 14, color: colors.primaryLight, textAlign: 'center', padding: 8},
});

export default ProgramDaySummary;
