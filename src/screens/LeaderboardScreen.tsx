import React, {useMemo, useState} from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  View,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useQuery} from '@tanstack/react-query';
import {colors} from '../constants/colors';
import Header from '../components/common/Header';
import FontAwesome5 from '@react-native-vector-icons/fontawesome5';
import {
  dailyLeaderboardQueryOptions,
  monthlyLeaderboardQueryOptions,
  yearlyLeaderboardQueryOptions,
} from '../tanstack-query';

type LeaderItem = {
  rank: number;
  username: string;
  reps: number;
};

type LeaderBoardType = 'daily' | 'monthly' | 'yearly';

export default function LeaderboardScreen() {
  const [leaderBoardMode, setLeaderBoardMode] = useState<LeaderBoardType>('daily');

  // 현재 날짜 정보 (KST 기준)
  const {todayKst, currentYear, currentMonth} = useMemo(() => {
    const now = new Date();

    // KST 날짜 문자열 (YYYY-MM-DD)
    const todayKstStr = now.toLocaleDateString('en-CA', {
      timeZone: 'Asia/Seoul',
    });

    // KST 기준으로 연도와 월 추출
    const kstFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Seoul',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    });

    const parts = kstFormatter.formatToParts(now);
    const year = parseInt(parts.find(p => p.type === 'year')?.value || '0', 10);
    const month = parseInt(parts.find(p => p.type === 'month')?.value || '0', 10);

    return {
      todayKst: todayKstStr,
      currentYear: year,
      currentMonth: month,
    };
  }, []);

  // 일일 리더보드 조회
  const {
    data: dailyData,
    isLoading: isLoadingDaily,
    refetch: refetchDaily,
    isRefetching: isRefetchingDaily,
  } = useQuery({
    ...dailyLeaderboardQueryOptions(todayKst),
    enabled: leaderBoardMode === 'daily',
  });

  // 월간 리더보드 조회
  const {
    data: monthlyData,
    isLoading: isLoadingMonthly,
    refetch: refetchMonthly,
    isRefetching: isRefetchingMonthly,
  } = useQuery({
    ...monthlyLeaderboardQueryOptions(currentYear, currentMonth),
    enabled: leaderBoardMode === 'monthly',
  });

  // 연간 리더보드 조회
  const {
    data: yearlyData,
    isLoading: isLoadingYearly,
    refetch: refetchYearly,
    isRefetching: isRefetchingYearly,
  } = useQuery({
    ...yearlyLeaderboardQueryOptions(currentYear),
    enabled: leaderBoardMode === 'yearly',
  });

  // 현재 모드에 따른 로딩/리프레시 상태
  const isLoading = useMemo(() => {
    switch (leaderBoardMode) {
      case 'daily':
        return isLoadingDaily;
      case 'monthly':
        return isLoadingMonthly;
      case 'yearly':
        return isLoadingYearly;
      default:
        return false;
    }
  }, [leaderBoardMode, isLoadingDaily, isLoadingMonthly, isLoadingYearly]);

  const isRefetching = useMemo(() => {
    switch (leaderBoardMode) {
      case 'daily':
        return isRefetchingDaily;
      case 'monthly':
        return isRefetchingMonthly;
      case 'yearly':
        return isRefetchingYearly;
      default:
        return false;
    }
  }, [
    leaderBoardMode,
    isRefetchingDaily,
    isRefetchingMonthly,
    isRefetchingYearly,
  ]);

  // 리더보드 데이터를 LeaderItem 형식으로 변환
  const items: LeaderItem[] = useMemo(() => {
    let data;
    switch (leaderBoardMode) {
      case 'daily':
        data = dailyData;
        break;
      case 'monthly':
        data = monthlyData;
        break;
      case 'yearly':
        data = yearlyData;
        break;
      default:
        data = null;
    }

    if (!data) {
      return [];
    }

    return data.map((row, idx) => ({
      rank: idx + 1,
      username: row.nickname || '익명',
      reps: row.total_reps,
    }));
  }, [leaderBoardMode, dailyData, monthlyData, yearlyData]);

  const onRefresh = () => {
    switch (leaderBoardMode) {
      case 'daily':
        refetchDaily();
        break;
      case 'monthly':
        refetchMonthly();
        break;
      case 'yearly':
        refetchYearly();
        break;
    }
  };
  const getHeaderTitle = () => {
    switch (leaderBoardMode) {
      case 'daily':
        return '오늘의 순위';
      case 'monthly':
        return '이번 달 순위';
      case 'yearly':
        return '올해 순위';
      default:
        return '순위';
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title={getHeaderTitle()} />

      <View style={styles.chips}>
        <TouchableOpacity
          style={[styles.chip, leaderBoardMode === 'daily' && styles.active]}
          onPress={() => {
            setLeaderBoardMode('daily');
          }}>
          <Text style={styles.chipText}>일</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.chip, leaderBoardMode === 'monthly' && styles.active]}
          onPress={() => {
            setLeaderBoardMode('monthly');
          }}>
          <Text style={styles.chipText}>월</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.chip, leaderBoardMode === 'yearly' && styles.active]}
          onPress={() => {
            setLeaderBoardMode('yearly');
          }}>
          <Text style={styles.chipText}>년</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tableHeader}>
        <Text style={[styles.th, styles.thRank]}>순위</Text>
        <Text style={[styles.th, styles.thUser]}>닉네임</Text>
        <Text style={[styles.th, styles.thReps]}>푸쉬업 횟수</Text>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>데이터를 불러오는 중...</Text>
        </View>
      ) : items.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>리더보드 데이터가 없습니다</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={item => String(item.rank)}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={onRefresh}
            />
          }
          renderItem={({item}) => (
            <View style={styles.row}>
              <Text style={[styles.cell, styles.cellRank]}>{item.rank}</Text>
              <View style={styles.cellUser}>
                <View style={styles.avatar}>
                  <FontAwesome5
                    name="user"
                    size={16}
                    color={colors.overlayMedium}
                  />
                </View>
                <Text style={styles.username}>{item.username}</Text>
              </View>
              <Text style={[styles.cell, styles.cellReps]}>
                {item.reps.toLocaleString()}
              </Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.backgroundDark,
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  th: {
    color: colors.textLight,
    fontSize: 12,
    opacity: 0.8,
  },
  thRank: {width: 50},
  thUser: {flex: 1},
  thReps: {width: 110, textAlign: 'right'},

  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: colors.overlayMedium,
  },
  cell: {
    color: colors.textLight,
    fontSize: 14,
  },
  cellRank: {width: 50, fontWeight: '700'},
  cellUser: {flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10},
  cellReps: {width: 110, textAlign: 'right', fontWeight: '700'},
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.overlayMedium,
    justifyContent: 'center',
    alignItems: 'center',
  },
  username: {color: colors.textLight, fontSize: 14, fontWeight: '600'},
  chips:{
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
    marginLeft: 10,
    marginBottom: 10,
  },
  chip:{
    backgroundColor: colors.gray400,
    paddingVertical: 5,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  active: {
    backgroundColor: colors.primary,
  },
  chipText: {
    color: colors.textLight,
    fontSize: 15,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
});
