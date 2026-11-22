import React from 'react';
import {StyleSheet, View} from 'react-native';
import {
  describeSets,
  todayPlan,
  type ProgramState,
} from '../../../domain/hundredPushups';
import {color, radius, space} from '../../../theme';
import {Button, Card, Icon, Text} from '../../ui';

type TodayHeroProps =
  | {
      title: string;
      description: string;
      actionLabel: string;
      actionVariant?: 'text';
      onAction: () => void;
      onOpenProgram?: () => void;
    }
  | {
      state: ProgramState;
      plan: ReturnType<typeof todayPlan>;
      onStart: () => void;
      /** 오늘 할 일을 이미 끝냈으면: 같은 모양으로 다음(내일) 운동을 보여 주고 '미리 하기'만 둔다 */
      done?: 'workout' | 'test';
    };

export function TodayHero(props: TodayHeroProps) {
  if (!('plan' in props)) {
    return (
      <Card>
        <Text variant="label" color="active" weight={700}>
          100개 챌린지
        </Text>
        <Text variant="headline">{props.title}</Text>
        <Text color="textMuted">{props.description}</Text>
        <Button
          variant={props.actionVariant ?? 'primary'}
          title={props.actionLabel}
          onPress={props.onAction}
        />
        {props.onOpenProgram && (
          <Button
            variant="text"
            title="프로그램 보기"
            icon="chevron-right"
            onPress={props.onOpenProgram}
          />
        )}
      </Card>
    );
  }

  const {state, plan, onStart, done} = props;
  const {sets, restSeconds, lastIsMax} = plan;
  const total = sets.reduce((sum, reps) => sum + reps, 0);
  const minutes = Math.ceil(
    (sets.length * 45 + (sets.length - 1) * restSeconds) / 60,
  );
  const chips = describeSets(sets, lastIsMax).split(' · ');
  const last = sets[sets.length - 1];

  return (
    <Card>
      <View style={styles.top}>
        <Text variant="label" color="active" weight={700} style={styles.copy}>
          100개 챌린지 · {done ? '내일 ' : ''}
          {state.week}주차 Day {state.day}
        </Text>
        {done ? (
          <View style={styles.doneMark}>
            <Icon name="check" size={16} color="active" />
            <Text variant="label" color="active" weight={700}>
              {done === 'workout' ? '오늘 완료' : '오늘 테스트 완료'}
            </Text>
          </View>
        ) : (
          <Text variant="label" color="textMuted">
            약 {minutes}분
          </Text>
        )}
      </View>
      <View
        accessible
        accessibilityLabel={`총 ${total}개를 ${sets.length}세트로 나눠서 해요`}
        style={styles.total}>
        <Text variant="hero" weight={900} style={styles.copy}>
          {total}
        </Text>
        <Text color="textMuted" weight={600} style={styles.copy}>
          개를 {sets.length}세트로{'\n'}나눠서 해요
        </Text>
      </View>
      <View style={styles.chips}>
        {chips.map((label, index) => {
          const max = lastIsMax && index === chips.length - 1;
          return (
            <View key={index} style={[styles.chip, max && styles.maxChip]}>
              <Text
                numeric
                weight={800}
                color={max ? 'active' : 'text'}
                style={styles.chipLabel}>
                {label}
              </Text>
            </View>
          );
        })}
      </View>
      <Text variant="caption" color="textMuted" style={styles.hint}>
        {done
          ? '오늘 할 운동은 끝났어요. 내일 이어서 해요.'
          : `마지막 ${last}+는 최소 ${last}개예요. 더 할 수 있으면 더 해요.`}
      </Text>
      {done ? (
        <Button variant="secondary" title="미리 하기" onPress={onStart} />
      ) : (
        <Button
          variant="primary"
          title="오늘 운동 시작"
          icon="play"
          onPress={onStart}
        />
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: space[8],
  },
  total: {flexDirection: 'row', alignItems: 'flex-end', gap: 10},
  copy: {flexShrink: 1},
  doneMark: {flexDirection: 'row', alignItems: 'center', gap: space[4]},
  chips: {flexDirection: 'row', gap: 6},
  chip: {
    flex: 1,
    minHeight: 52,
    borderRadius: radius.s,
    backgroundColor: color.surface2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  maxChip: {
    backgroundColor: color.activeSoft,
    borderWidth: 1,
    borderColor: color.activeDim,
  },
  chipLabel: {fontSize: 26, lineHeight: 32},
  hint: {lineHeight: 19},
});
