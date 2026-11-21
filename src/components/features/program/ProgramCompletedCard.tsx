import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import CustomButton from '../../common/CustomButton';
import {colors} from '../../../constants/colors';
import {cardStyles as styles} from './cardStyles';

interface ProgramCompletedCardProps {
  lastTestReps: number;
  /** ISO 시각 */
  startedAt: string;
  finishedAt: string;
  passedDays: number;
  onRestart: () => void;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** 시작일과 완료일을 모두 포함한 일수. 날짜를 읽을 수 없으면 null */
const daysBetween = (startedAt: string, finishedAt: string): number | null => {
  const span = new Date(finishedAt).getTime() - new Date(startedAt).getTime();
  return Number.isFinite(span) && span >= 0 ? Math.floor(span / DAY_MS) + 1 : null;
};

/** 100개 달성 화면. 다시 시작하기 전까지 계속 보인다 */
function ProgramCompletedCard({
  lastTestReps,
  startedAt,
  finishedAt,
  passedDays,
  onRestart,
}: ProgramCompletedCardProps) {
  const days = daysBetween(startedAt, finishedAt);
  return (
    <View style={styles.card}>
      <Text style={styles.heading}>100개 달성</Text>
      <Text style={styles.body}>연속 {lastTestReps}개. 프로그램을 끝까지 해냈어요.</Text>
      <View style={local.stats}>
        {days !== null ? (
          <View style={local.stat}>
            <Text style={local.statNumber}>{days}일</Text>
            <Text style={styles.hint}>걸린 기간</Text>
          </View>
        ) : null}
        <View style={local.stat}>
          <Text style={local.statNumber}>{passedDays}일</Text>
          <Text style={styles.hint}>통과한 운동</Text>
        </View>
      </View>
      <CustomButton title="다시 시작" variant="start" style={styles.button} onPress={onRestart} />
    </View>
  );
}

const local = StyleSheet.create({
  stats: {flexDirection: 'row', gap: 12},
  stat: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.overlayLight,
    borderRadius: 12,
    paddingVertical: 16,
    gap: 4,
  },
  statNumber: {fontSize: 22, fontWeight: 'bold', color: colors.textLight},
});

export default ProgramCompletedCard;
