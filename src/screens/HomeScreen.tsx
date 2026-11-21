import React, {useCallback} from 'react';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {StyleSheet, Text, View} from 'react-native';
import {useQuery} from '@tanstack/react-query';
import {colors} from '../constants/colors';
import Logo from '../assets/svgs/logo.svg';
import ModeCard from '../components/features/home/ModeCard';
import LinkRow from '../components/features/home/LinkRow';
import {useSession} from '../hooks/useSession';
import {currentProgramQueryOptions} from '../tanstack-query';
import {toProgramState} from '../remote/program';
import {resolveProgramView} from '../domain/programView';
import StreakBadge from '../components/features/streak/StreakBadge';
import {useStreak} from '../hooks/useStreak';
import {useNow} from '../hooks/useNow';
import {streakBanner} from '../domain/streakMessages';

function HomeScreen(): React.JSX.Element {
  const navigation = useNavigation();
  const {user} = useSession();
  const programQuery = useQuery(currentProgramQueryOptions(user?.id ?? ''));
  const programRow = programQuery.data;
  // 배너는 시각(18시 전후)에, 스트릭은 오늘 날짜에 따라 바뀐다 — 앱으로 돌아올 때와 이 화면으로 돌아올 때 다시 읽는다.
  // 운동 뒤 popTo 로 돌아오면 앱 상태가 바뀌지 않으므로, 자정을 넘겨도 포커스 때 갱신해야 어제에 머물지 않는다
  const {now, refresh: refreshNow} = useNow();
  useFocusEffect(useCallback(() => refreshNow(), [refreshNow]));
  // 같은 시계로 계산해 배너와 불꽃이 서로 다른 날을 보지 않게 한다. 못 불러왔으면(null) 둘 다 그리지 않는다
  const streak = useStreak(now);

  // 조회 전·조회 실패일 때는 "시작 전"이라고 말하지 않는다 (진행 중인 사람에게 틀린 정보)
  const programStatusText = (): string | undefined => {
    switch (resolveProgramView(programQuery)) {
      case 'none':
        return '시작 전';
      case 'testDue':
        return '테스트 차례';
      case 'completed':
        return '완료';
      case 'active': {
        const program = programRow ? toProgramState(programRow) : null;
        return program ? `${program.week}주차 · Day ${program.day}` : undefined;
      }
      default:
        return undefined;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.top}>
        <View style={styles.titleRow}>
          <Logo width={26} height={26} fill={colors.primary} />
          <Text style={styles.title}>PushOn</Text>
          {streak && (
            <View style={styles.badge}>
              <StreakBadge
                current={streak.current}
                todayDone={streak.todayDone}
                onPress={() => navigation.navigate('Streak')}
              />
            </View>
          )}
        </View>
        {streak && <Text style={styles.banner}>{streakBanner(streak, now.getHours())}</Text>}
      </View>

      <Text style={styles.sectionTitle}>운동 모드</Text>

      <View style={styles.cards}>
        <ModeCard
          icon="bolt"
          title="챌린지"
          description="한 세트에 몇 개까지 되는지 도전해요"
          onPress={() => navigation.navigate('Challenge')}
        />
        <ModeCard
          icon="layer-group"
          title="세트"
          description="세트 수와 목표 횟수를 정하고 휴식까지 챙겨요"
          onPress={() => navigation.navigate('SetsSetup')}
        />
        <ModeCard
          icon="flag-checkered"
          title="100개 챌린지"
          description="테스트 결과에 맞춘 세트로 연속 100개까지"
          status={programStatusText()}
          onPress={() => navigation.navigate('Program')}
        />
      </View>

      <View style={styles.divider} />
      <LinkRow
        icon="trophy"
        title="순위 보러가기"
        onPress={() => navigation.navigate('Leaderboard')}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    padding: 20,
    backgroundColor: colors.backgroundDark,
  },
  top: {
    gap: 8,
    marginBottom: 32,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    marginLeft: 'auto',
  },
  banner: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.primaryLight,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textLight,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textLight,
    marginBottom: 16,
  },
  cards: {
    gap: 12,
  },
  divider: {
    height: 1,
    backgroundColor: colors.overlayMedium,
    marginVertical: 20,
  },
});

export default HomeScreen;
