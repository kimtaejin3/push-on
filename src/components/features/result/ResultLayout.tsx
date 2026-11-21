import React, {type ReactNode} from 'react';
import {ScrollView, StatusBar, StyleSheet, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useQuery} from '@tanstack/react-query';
import {resultFacts} from '../../../domain/resultFacts';
import {useSession} from '../../../hooks/useSession';
import type {WorkoutMode} from '../../../remote/pushup';
import {getBestSetBefore, getPreviousWorkoutTotal} from '../../../remote/workoutHistory';
import {queryKeys} from '../../../tanstack-query/queryKeys';
import {color, layout, radius, space} from '../../../theme';
import {formatTimeKorean} from '../../../utils/time';
import {Button} from '../../ui/Button';
import {Card} from '../../ui/Card';
import {Chip} from '../../ui/Chip';
import {Icon} from '../../ui/Icon';
import {Text} from '../../ui/Text';
import {FactRow} from './FactRow';
import {SetBars} from './SetBars';

export type ResultAction = {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
};

interface ResultLayoutProps {
  mode: WorkoutMode;
  /** 이 운동을 시작한 시각. 이보다 앞선 기록과 비교한다 (이번 운동에서 먼저 저장한 세트가 섞이지 않도록) */
  beforeIso: string;
  /** 완료 칩 문구 (예: "3주차 Day 2 통과") */
  completion: string;
  /** 완료 칩을 회색으로 (0개·실패처럼 축하할 일이 아닐 때) */
  neutral?: boolean;
  results: number[];
  /** 세트 목표. 있으면 목표 대비 문구와 세트 막대를 그린다 */
  targets?: number[];
  lastIsMax?: boolean;
  seconds: number;
  /** 목표 대비 문구 대신 보여줄 문구 */
  headline?: string;
  /** 운동 중 세트 저장 상태 */
  setSaveStatus?: 'queued' | 'failed' | null;
  /** 버튼 바로 위에 붙는 경고 (저장 실패 등) */
  warning?: string;
  action: ResultAction;
  secondaryAction?: ResultAction;
  onHistory?: () => void;
  children?: ReactNode;
}

const signed = (diff: number) => (diff < 0 ? `−${Math.abs(diff)}` : `+${diff}`);

/**
 * 결과 화면 공통 틀: 완료 칩 → 총합과 목표 대비 → 세트 막대 → 사실 행 → (화면별 내용) → 버튼.
 * 지난번·한 세트 최고는 여기서 조회하고, 실패하거나 아직 모르면 그 행을 뺀다.
 */
export function ResultLayout({
  mode,
  beforeIso,
  completion,
  neutral = false,
  results,
  targets,
  lastIsMax = false,
  seconds,
  headline,
  setSaveStatus,
  warning,
  action,
  secondaryAction,
  onHistory,
  children,
}: ResultLayoutProps) {
  const {user} = useSession();
  const singleSet = mode === 'challenge' || mode === 'program_test';
  const hasReps = results.some(reps => reps > 0);
  const enabled = !!user?.id && hasReps;
  // 한 번에 몇 개(챌린지·테스트)는 같은 모드끼리, 세트 운동은 모든 운동의 한 세트와 비교한다 — 운동 중 축하와 같은 기준
  const bestMode = singleSet ? mode : undefined;
  const previous = useQuery({
    queryKey: [...queryKeys.pushup.all, 'previousWorkoutTotal', user?.id, mode, beforeIso],
    queryFn: () => getPreviousWorkoutTotal(mode, beforeIso),
    enabled,
  });
  const best = useQuery({
    // 운동 화면의 조회와 같은 키라 캐시를 그대로 쓴다
    queryKey: bestMode
      ? [...queryKeys.pushup.all, 'bestSetBefore', user?.id, beforeIso, bestMode]
      : [...queryKeys.pushup.all, 'bestSetBefore', user?.id, beforeIso],
    queryFn: () => getBestSetBefore(beforeIso, bestMode),
    enabled,
  });
  // undefined = 모름(조회 중·실패) → 행을 뺀다, null = 이전 기록 없음
  const previousTotal = previous.isSuccess ? previous.data : undefined;
  const previousBestSet = best.isSuccess ? best.data : undefined;
  const facts = resultFacts({
    results,
    targets: targets ?? null,
    lastIsMax,
    previousTotal: previousTotal ?? null,
    previousBestSet: previousBestSet ?? null,
  });
  const firstRecord = hasReps && previousTotal === null;
  const challengeBest = mode === 'challenge' && facts.isPersonalBestSet;
  const chip =
    firstRecord && mode === 'challenge'
      ? '첫 기록'
      : firstRecord
      ? `${completion} · 첫 기록`
      : challengeBest
      ? `${completion} · 최고 기록`
      : completion;
  const chipTone = challengeBest ? 'record' : neutral ? 'neutral' : 'active';
  const lastIndex = targets ? targets.length - 1 : -1;
  const goalDiff = facts.diffFromTarget;
  const goalCopy =
    headline ??
    (goalDiff === null || singleSet
      ? null
      : goalDiff === 0
      ? `목표 ${facts.target}개를 채웠어요`
      : goalDiff > 0
      ? `목표 ${facts.target}개보다 ${goalDiff}개 더 했어요`
      : `목표 ${facts.target}개보다 ${Math.abs(goalDiff)}개 적었어요`);
  const busy = action.loading || action.disabled;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.chip}>
          <Chip label={chip} tone={chipTone} />
        </View>
        <View style={styles.hero}>
          <Text color="textMuted" weight={700}>
            {singleSet ? '한 번에 해낸 개수' : '오늘 총합'}
          </Text>
          <View style={styles.totalLine}>
            <Text
              numeric
              weight={900}
              color={hasReps ? 'text' : 'quiet'}
              style={styles.total}>
              {facts.total}
            </Text>
            <Text variant="title" color="textMuted">
              개
            </Text>
          </View>
          {goalCopy && (
            <Text variant="headline" color={neutral ? 'text' : 'active'}>
              {goalCopy}
            </Text>
          )}
          {challengeBest && previousBestSet != null && (
            <Text variant="headline" color="record">
              최고 기록! 이전 {previousBestSet}개보다 {facts.bestSetReps - previousBestSet}개 더
            </Text>
          )}
          {mode === 'challenge' &&
            !challengeBest &&
            facts.diffFromPrevious !== null &&
            facts.diffFromPrevious > 0 && (
              <Text variant="headline">
                지난번보다 {facts.diffFromPrevious}개 더 했어요
              </Text>
            )}
          {firstRecord && mode === 'challenge' && (
            <Text variant="headline">
              이게 기준이 돼요. 다음 도전부터 이 숫자와 비교해요
            </Text>
          )}
        </View>
        {targets && !singleSet && (
          <SetBars
            results={results}
            targets={targets}
            bestSetIndex={facts.bestSetIndex}
            lastIsMax={lastIsMax}
            freeSets={mode === 'sets'}
          />
        )}
        {hasReps && (
          <View>
            {previousTotal != null && facts.diffFromPrevious !== null && (
              <FactRow
                label="지난번 대비"
                value={`${previousTotal}개 → ${signed(facts.diffFromPrevious)}`}
              />
            )}
            {facts.lastSetExtra !== null && targets && !singleSet && (
              <FactRow
                label={`마지막 세트 (최소 ${targets[lastIndex]}+)`}
                value={`${results[lastIndex] ?? 0}개 · ${signed(facts.lastSetExtra)}`}
                tone={facts.lastSetExtra < 0 ? 'alert' : 'active'}
              />
            )}
            {previousBestSet !== undefined && (
              <FactRow
                label={singleSet ? '한 번에 최고' : '한 세트 최고'}
                value={`${facts.bestSetReps}개${
                  previousBestSet !== null ? ` · 이전 ${previousBestSet}` : ''
                }`}
                tone={facts.isPersonalBestSet ? 'record' : 'text'}
              />
            )}
            <FactRow label="걸린 시간" value={formatTimeKorean(seconds)} />
          </View>
        )}
        {children}
        {setSaveStatus && (
          <Card>
            <Text
              color={setSaveStatus === 'failed' ? 'alert' : 'textMuted'}
              variant="label">
              {setSaveStatus === 'queued'
                ? '저장이 지연되고 있어요. 연결되면 자동으로 다시 보내요'
                : '세트를 저장하지 못했어요. 로그인 상태를 확인해 주세요'}
            </Text>
          </Card>
        )}
        <View style={styles.footer}>
          {warning && (
            <Text color="alert" variant="label" style={styles.centered}>
              {warning}
            </Text>
          )}
          <Button variant="primary" {...action} />
          {secondaryAction && (
            <Button
              variant="secondary"
              {...secondaryAction}
              disabled={secondaryAction.disabled || busy}
            />
          )}
          {onHistory && (
            <View style={styles.history}>
              <Button
                variant="text"
                title="기록에서 보기"
                icon="chevron-right"
                onPress={onHistory}
                disabled={busy}
              />
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/** "다음 운동 · …" 카드 */
export function NextWorkout({title, detail}: {title: string; detail?: string}) {
  return (
    <Card style={styles.next}>
      <View style={styles.calendar}>
        <Icon name="calendar-days" color="text" size={22} />
      </View>
      <View style={styles.nextCopy}>
        <Text weight={800}>{title}</Text>
        {detail && (
          <Text variant="label" color="textMuted">
            {detail}
          </Text>
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  safeArea: {flex: 1, backgroundColor: color.bg},
  content: {
    flexGrow: 1,
    gap: space[20],
    paddingTop: space[8],
    paddingBottom: space[20],
    paddingHorizontal: layout.screenPadding,
  },
  chip: {alignSelf: 'flex-start'},
  hero: {gap: space[4]},
  totalLine: {flexDirection: 'row', alignItems: 'flex-end', gap: 6},
  total: {fontSize: 128, lineHeight: 109, flexShrink: 1},
  centered: {textAlign: 'center'},
  footer: {marginTop: 'auto', gap: space[12]},
  history: {alignItems: 'center'},
  next: {flexDirection: 'row', alignItems: 'center', padding: space[16]},
  calendar: {
    width: layout.touchMin,
    height: layout.touchMin,
    borderRadius: radius.m,
    backgroundColor: color.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextCopy: {flex: 1, gap: space[4]},
});
