import React, {useCallback} from 'react';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {useQuery} from '@tanstack/react-query';
import {Alert, ScrollView, StyleSheet, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {NativeAdCard} from '../components/ads/NativeAdCard';
import {OtherWorkoutRow} from '../components/features/home/OtherWorkoutRow';
import {StreakRow} from '../components/features/home/StreakRow';
import {TodayHero} from '../components/features/home/TodayHero';
import {Card, Row, Text} from '../components/ui';
import {useTabBarInset} from '../components/ui/TabBar';
import {ErrorState} from '../components/ui/feedback/ErrorState';
import {Skeleton} from '../components/ui/feedback/Skeleton';
import {NATIVE_HOME_AD_UNIT_ID} from '../constants/ads';
import {WEEKS} from '../constants/hundredPushups';
import {
  describeSets,
  passedDayCount,
  testThreshold,
  todayPlan,
  todayProgress,
} from '../domain/hundredPushups';
import {resolveProgramView} from '../domain/programView';
import {useNow} from '../hooks/useNow';
import {useSession} from '../hooks/useSession';
import {useStreak} from '../hooks/useStreak';
import {toProgramState} from '../remote/program';
import {getBestSetBefore} from '../remote/workoutHistory';
import {currentProgramQueryOptions} from '../tanstack-query';
import {queryKeys} from '../tanstack-query/queryKeys';
import {color, layout, radius, space} from '../theme';

const dateFormat = new Intl.DateTimeFormat('ko-KR', {
  month: 'long',
  day: 'numeric',
  weekday: 'long',
});

function HomeScreen(): React.JSX.Element {
  const navigation = useNavigation();
  const tabBarInset = useTabBarInset();
  const {user} = useSession();
  const programQuery = useQuery(currentProgramQueryOptions(user?.id ?? ''));
  const programRow = programQuery.data;

  // 운동 화면에서 돌아오면 자정을 넘겼을 수 있어 오늘 날짜를 다시 읽는다.
  const {now, refresh: refreshNow} = useNow();
  useFocusEffect(useCallback(() => refreshNow(), [refreshNow]));
  const streak = useStreak(now);
  const best = useQuery({
    queryKey: [...queryKeys.pushup.all, 'bestChallengeSet', user?.id],
    queryFn: () => getBestSetBefore(new Date().toISOString(), 'challenge'),
    enabled: !!user,
  });

  const goTest = () =>
    navigation.navigate('Challenge', {purpose: 'program-test'});

  const renderHero = () => {
    const view = resolveProgramView(programQuery);
    if (view === 'loading') {
      return (
        <Card>
          <Skeleton width={150} height={20} />
          <Skeleton width={120} height={86} />
          <Skeleton width="fill" height={52} radius={radius.s} />
          <Skeleton
            width="fill"
            height={layout.primaryButtonHeight}
            radius={radius.m}
          />
        </Card>
      );
    }
    if (view === 'error') {
      return (
        <ErrorState
          title="프로그램 정보를 불러오지 못했어요"
          actionLabel="다시 시도"
          onAction={() => programQuery.refetch()}
        />
      );
    }
    if (view === 'none' || !programRow) {
      return (
        <TodayHero
          title="연속 100개에 도전해요"
          description="먼저 한 번에 몇 개까지 할 수 있는지 재요. 테스트 결과에 맞춰 오늘 할 세트를 정해요."
          actionLabel="초기 테스트 시작"
          onAction={goTest}
          onOpenProgram={() => navigation.navigate('Tabs', {screen: 'Program'})}
        />
      );
    }

    const state = toProgramState(programRow);
    if (view === 'completed') {
      const passedDays = passedDayCount(programRow.completed_days);
      return (
        <TodayHero
          title="100개 달성"
          description={`연속 ${state.lastTestReps}개 · 통과한 운동 ${passedDays}일`}
          actionLabel="다시 시작"
          onAction={() =>
            Alert.alert(
              '다시 시작',
              '초기 테스트부터 새로 시작해요.\n완료 기록은 그대로 남아요.',
              [
                {text: '취소', style: 'cancel'},
                {text: '테스트 하기', onPress: goTest},
              ],
            )
          }
        />
      );
    }
    if (view === 'testDue') {
      const threshold = testThreshold(state.week);
      const isFinal = state.week === WEEKS;
      const next = isFinal
        ? '100개 챌린지를 완료해요'
        : `${state.week + 1}주차로 넘어가요`;
      return (
        <TodayHero
          title={isFinal ? '최종 테스트 차례' : `${state.week}주차 테스트 차례`}
          description={
            threshold === null
              ? '연속으로 몇 개까지 할 수 있는지 재요.'
              : `${threshold}개 이상이면 ${next}. 기준에 못 미치면 ${state.week}주차를 한 번 더 해요.`
          }
          actionLabel="최대 횟수 테스트"
          onAction={goTest}
        />
      );
    }

    const plan = todayPlan(state);
    const startWorkout = () =>
      navigation.navigate('Workout', {
        plan,
        source: {kind: 'program', programId: programRow.id},
      });
    const progress = todayProgress(
      programRow.completed_days,
      state,
      programRow.created_at,
      now,
    );
    if (progress !== 'open') {
      const nextSets = describeSets(plan.sets, plan.lastIsMax);
      return (
        <TodayHero
          title={
            progress === 'doneWorkout'
              ? '오늘 운동 완료'
              : '오늘은 테스트를 했어요'
          }
          description={`내일 이어서 해요\n${state.week}주차 · Day ${state.day} · ${nextSets}`}
          actionLabel="미리 하기"
          actionVariant="text"
          onAction={startWorkout}
        />
      );
    }
    return <TodayHero state={state} plan={plan} onStart={startWorkout} />;
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={[styles.content, {paddingBottom: tabBarInset}]}>
        <View style={styles.header}>
          <Text variant="label" color="textMuted">
            {dateFormat.format(now)}
          </Text>
          <Text variant="title">오늘 할 운동</Text>
        </View>
        {renderHero()}
        {streak && (
          <StreakRow
            streak={streak}
            hour={now.getHours()}
            onPress={() => navigation.navigate('Streak')}
          />
        )}
        <View>
          <Text variant="label" color="textMuted" weight={700}>
            다른 운동
          </Text>
          <OtherWorkoutRow
            icon="zap"
            title="한 번에 몇 개?"
            subtitle="쉬지 않고 최대 개수 재기"
            best={best.isError ? null : best.data}
            onPress={() => navigation.navigate('Challenge')}
          />
          <OtherWorkoutRow
            icon="layers"
            title="자유 세트"
            subtitle="세트·목표·휴식을 직접 정해요"
            onPress={() => navigation.navigate('SetsSetup')}
          />
          <Row
            icon="trophy"
            title="순위 보기"
            onPress={() => navigation.navigate('Leaderboard')}
          />
        </View>
        {/* 광고가 꺼졌거나 실패하면 null 이라 간격도 함께 사라진다. 탭바와는 paddingBottom(tabBarInset)으로 40 이상 떨어진다 */}
        <NativeAdCard unitId={NATIVE_HOME_AD_UNIT_ID} style={styles.ad} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {flex: 1, backgroundColor: color.bg},
  content: {
    paddingTop: space[4],
    paddingHorizontal: layout.screenPadding,
    gap: space[20],
  },
  header: {gap: 2},
  // '다른 운동'과 28 (content gap 20 + 8)
  ad: {marginTop: space[8]},
});

export default HomeScreen;
