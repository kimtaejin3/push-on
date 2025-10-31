import React, {useEffect, useState} from 'react';
import {FlatList, StyleSheet, Text, View, RefreshControl} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {colors} from '../constants/colors';
import Header from '../components/common/Header';
import {useNavigation} from '@react-navigation/native';
import {supabase} from '../lib/supabase';
import FontAwesome5 from '@react-native-vector-icons/fontawesome5';

type LeaderItem = {
  rank: number;
  username: string;
  reps: number;
};

const MOCK_DATA: LeaderItem[] = [];

// 국가 표시는 제거됨

export default function LeaderboardScreen() {
  const navigation = useNavigation();
  const [items, setItems] = useState<LeaderItem[]>(MOCK_DATA);
  const [refreshing, setRefreshing] = useState(false);

  async function fetchTodayLeaderboard() {
    const todayKst = new Date().toLocaleDateString('en-CA', {
      timeZone: 'Asia/Seoul',
    }); // YYYY-MM-DD

    // RLS 우회를 위해 RPC 함수 사용
    const {data, error} = await supabase.rpc('get_leaderboard', {
      target_date: todayKst,
    });

    if (error) {
      console.warn('리더보드 조회 실패:', error.message);
      return;
    }

    const mapped: LeaderItem[] = (data || []).map((row: any, idx: number) => ({
      rank: idx + 1,
      username: row.nickname ? `${row.nickname}` : '익명',
      reps: row.total_reps ?? 0,
    }));
    setItems(mapped);
  }

  useEffect(() => {
    fetchTodayLeaderboard();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTodayLeaderboard();
    setRefreshing(false);
  };
  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="오늘의 순위" onBackPress={() => navigation.goBack()} />

      <View style={styles.tableHeader}>
        <Text style={[styles.th, styles.thRank]}>순위</Text>
        <Text style={[styles.th, styles.thUser]}>닉네임</Text>
        <Text style={[styles.th, styles.thReps]}>푸쉬업 횟수</Text>
      </View>

      <FlatList
        data={items}
        keyExtractor={item => String(item.rank)}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
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
    borderTopWidth: 1,
    borderBottomWidth: 1,
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
  // 국가 관련 스타일 제거됨
});
