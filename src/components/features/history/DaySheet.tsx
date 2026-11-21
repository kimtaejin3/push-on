import React, {useMemo} from 'react';
import {PanResponder, StyleSheet, View} from 'react-native';
import {CloudUpload} from 'lucide-react-native';
import {groupSetsByWorkout, type WorkoutGroup} from '../../../domain/history';
import type {PushupSetData} from '../../../remote/pushup';
import {color, radius, space} from '../../../theme';
import {formatTimeKorean} from '../../../utils/time';
import {Button} from '../../ui/Button';
import {BottomSheet} from '../../ui/feedback/BottomSheet';
import {Text} from '../../ui/Text';

const dayFormat = new Intl.DateTimeFormat('ko-KR', {
  timeZone: 'UTC',
  month: 'long',
  day: 'numeric',
  weekday: 'long',
});
const timeFormat = new Intl.DateTimeFormat('ko-KR', {
  hour: 'numeric',
  minute: '2-digit',
});

const sumReps = (sets: PushupSetData[]) =>
  sets.reduce((sum, set) => sum + set.reps, 0);

function WorkoutDetails({group}: {group: WorkoutGroup}) {
  const {sets, mode, label} = group;
  const duration = sets.reduce((sum, set) => sum + set.duration_seconds, 0);
  const showSets = sets.length > 1 || sets[0].target_reps !== null;
  return (
    <View style={styles.workout}>
      <View style={styles.line}>
        <Text variant="label" weight={800} style={styles.label}>
          {mode === 'challenge' ? '한 번에 몇 개?' : label}
        </Text>
        <Text variant="caption" color="textMuted" style={styles.time}>
          {timeFormat.format(new Date(sets[0].created_at))} ·{' '}
          {formatTimeKorean(duration)}
        </Text>
      </View>
      <View style={styles.line}>
        <View style={styles.sets}>
          {showSets
            ? sets.map((set, index) => (
                <View
                  key={set.id}
                  accessible
                  accessibilityLabel={`세트 ${index + 1}, ${set.reps}개${
                    set.target_reps === null
                      ? ''
                      : `, 목표 ${set.target_reps}개`
                  }, ${formatTimeKorean(set.duration_seconds)}`}
                  style={styles.set}>
                  <Text numeric weight={800} style={styles.setReps}>
                    {set.reps}
                    {set.target_reps === null ? '' : `/${set.target_reps}`}
                  </Text>
                  <Text
                    variant="caption"
                    color="textMuted"
                    style={styles.setTime}>
                    {formatTimeKorean(set.duration_seconds)}
                  </Text>
                </View>
              ))
            : null}
        </View>
        <View style={styles.total}>
          <Text numeric weight={800} style={styles.totalValue}>
            {sumReps(sets)}
          </Text>
          <Text variant="caption" color="textMuted">
            개
          </Text>
        </View>
      </View>
    </View>
  );
}

interface Props {
  date: string;
  sets: PushupSetData[];
  pendingCount: number;
  onClose: () => void;
}

export function DaySheet({date, sets, pendingCount, onClose}: Props) {
  const swipe = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) =>
          gesture.dy > 12 && gesture.dy > Math.abs(gesture.dx),
        onPanResponderRelease: (_, gesture) => {
          if (gesture.dy > 36) {
            onClose();
          }
        },
      }),
    [onClose],
  );

  return (
    <BottomSheet visible onClose={onClose}>
      <View {...swipe.panHandlers} style={styles.title}>
        <Text variant="headline" weight={800}>
          {dayFormat.format(new Date(date))}
        </Text>
      </View>
      {pendingCount > 0 ? (
        <View style={styles.pending}>
          <CloudUpload size={20} color={color.record} accessible={false} />
          <View style={styles.label}>
            <Text variant="label" weight={800}>
              {Number(date.slice(-2))}일 · 폰에 보관 중 {pendingCount}건
            </Text>
            <Text variant="caption" color="textMuted">
              저장 대기 · 연결되면 저장해요.
            </Text>
          </View>
        </View>
      ) : null}
      {sets.length > 0 ? (
        <>
          {groupSetsByWorkout(sets).map(group => (
            <WorkoutDetails key={group.key} group={group} />
          ))}
          <View style={styles.line}>
            <Text variant="label" color="textMuted">
              이날 합계
            </Text>
            <Text variant="label" weight={800}>
              {sumReps(sets)}개
            </Text>
          </View>
        </>
      ) : (
        <Text variant="label" color="textMuted">
          이날은 쉬었어요.
        </Text>
      )}
      <Button variant="secondary" title="닫기" onPress={onClose} />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  title: {minHeight: 44, justifyContent: 'center'},
  workout: {
    gap: space[8],
    paddingBottom: space[12],
    borderBottomWidth: 1,
    borderBottomColor: color.border,
  },
  line: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: space[8],
  },
  label: {flex: 1},
  time: {flexShrink: 1, textAlign: 'right'},
  sets: {flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 6},
  set: {
    minWidth: 36,
    alignItems: 'center',
    backgroundColor: color.surface2,
    borderRadius: radius.s,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  setReps: {fontSize: 16, lineHeight: 20},
  setTime: {fontSize: 10, lineHeight: 14},
  total: {flexDirection: 'row', alignItems: 'baseline', gap: 3},
  totalValue: {fontSize: 26, lineHeight: 28},
  pending: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.m,
    backgroundColor: color.offlineBar,
    gap: space[12],
    padding: space[12],
  },
});
