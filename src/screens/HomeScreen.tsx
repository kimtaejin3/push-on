import React from 'react';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {StyleSheet, Text, View} from 'react-native';
import {useQuery} from '@tanstack/react-query';
import {colors} from '../constants/colors';
import Logo from '../assets/svgs/logo.svg';
import ModeCard from '../components/features/home/ModeCard';
import {useSession} from '../hooks/useSession';
import {activeProgramQueryOptions} from '../tanstack-query';
import {toProgramState} from '../remote/program';
import {ProgramState} from '../domain/hundredPushups';

const programStatusText = (program: ProgramState | null): string => {
  if (!program) {
    return '시작 전';
  }
  if (program.testDue) {
    return '테스트 차례';
  }
  return `${program.week}주차 · Day ${program.day}`;
};

function HomeScreen(): React.JSX.Element {
  const navigation = useNavigation();
  const {user} = useSession();
  const {data: programRow} = useQuery(activeProgramQueryOptions(user?.id ?? ''));
  const program = programRow ? toProgramState(programRow) : null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.titleRow}>
        <Logo width={26} height={26} fill={colors.primary} />
        <Text style={styles.title}>PushOn</Text>
      </View>

      <Text style={styles.sectionTitle}>운동 모드</Text>
      <Text style={styles.sectionSubtitle}>오늘은 어떻게 할까요?</Text>

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
          title="100개 만들기"
          description="6주 프로그램으로 연속 100개까지"
          status={programStatusText(program)}
          onPress={() => navigation.navigate('Program')}
        />
      </View>

      <View style={styles.leaderboardSection}>
        <ModeCard
          icon="trophy"
          title="순위 보러가기"
          description="오늘 · 이번 달 · 올해 리더보드"
          onPress={() => navigation.navigate('Leaderboard')}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    padding: 20,
    backgroundColor: colors.backgroundDark,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 32,
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
  },
  sectionSubtitle: {
    fontSize: 14,
    color: colors.gray400,
    marginTop: 4,
    marginBottom: 16,
  },
  cards: {
    gap: 12,
  },
  leaderboardSection: {
    marginTop: 24,
  },
});

export default HomeScreen;
