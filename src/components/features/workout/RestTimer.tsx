import React from 'react';
import {StyleSheet, View} from 'react-native';
import {color, radius, space} from '../../../theme';
import {REST_EXTEND_SECONDS} from '../../../domain/workoutSession';
import Count from '../push-up/Count';
import TimerContainer from '../push-up/TimerContainer';
import {Text} from '../../ui/Text';
import {WorkoutAction} from './WorkoutAction';

interface RestTimerProps {
  remaining: number;
  duration: number;
  autoNext: boolean;
  onSkip: () => void;
  onExtend: () => void;
  last: {setNumber: number; reps: number; target: number; isMax: boolean};
  next: {reps: number; isMax: boolean};
  note?: string;
}

function RestTimer({
  remaining,
  duration,
  autoNext,
  onSkip,
  onExtend,
  last,
  next,
  note,
}: RestTimerProps) {
  const short = last.target - last.reps;
  const nextLabel = next.isMax
    ? `다음 세트 최소 ${next.reps}개`
    : `다음 세트 ${next.reps}개`;
  return (
    <>
      <View style={styles.hero}>
        <Count value={remaining} color="onAccent" />
        <Text color="onAccent" weight={800} style={styles.heroLabel}>
          초 쉬어요
        </Text>
      </View>
      <View style={styles.footer}>
        <TimerContainer
          label={nextLabel}
          detail={autoNext ? '자동 시작' : undefined}
          progress={remaining / Math.max(1, duration)}
          resting
        />
        {next.isMax && (
          <Text color="onAccent">
            마지막 세트는 최소 목표를 넘겨도 가능한 만큼 해요.
          </Text>
        )}
        <View style={styles.result}>
          <Text color="onAccent" weight={700}>
            세트 {last.setNumber} · {last.reps} / {last.target}
            {last.isMax ? '+' : ''}
          </Text>
          <Text color="onAccent" variant="label" weight={700}>
            {short > 0 ? `${short}개 부족` : '완료'}
          </Text>
        </View>
        {note ? (
          <Text color="onAccent" variant="label">
            {note}
          </Text>
        ) : null}
        <View style={styles.actions}>
          <WorkoutAction
            title={`${REST_EXTEND_SECONDS}초 더 쉬기`}
            icon="plus"
            variant="rest"
            onPress={onExtend}
          />
          <WorkoutAction
            title="바로 시작"
            icon="skip-forward"
            variant="restPrimary"
            onPress={onSkip}
          />
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  hero: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: space[12],
  },
  heroLabel: {fontSize: 44, lineHeight: 54, textAlign: 'center'},
  footer: {gap: space[8]},
  result: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: space[8],
    padding: space[8],
    borderRadius: radius.s,
    backgroundColor: `${color.bg}1A`,
  },
  actions: {flexDirection: 'row', gap: space[12]},
});

export default RestTimer;
