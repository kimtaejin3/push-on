import React from 'react';
import {FlatList, Image, StyleSheet, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {colors} from '../constants/colors';
import Header from '../components/common/Header';
import {useNavigation} from '@react-navigation/native';

type LeaderItem = {
  rank: number;
  username: string;
  reps: number;
  avatarUrl?: string;
};

const MOCK_DATA: LeaderItem[] = [
  {rank: 1, username: '@ronmccallum', reps: 5813},
  {rank: 2, username: '@v27', reps: 4000},
  {rank: 3, username: '@kjtalford', reps: 2633},
  {rank: 4, username: '@andrewolsen', reps: 2517},
  {rank: 5, username: '@swen76', reps: 1420},
  {rank: 6, username: '@eldar', reps: 1242},
  {rank: 7, username: '@strmz', reps: 1204},
  {rank: 8, username: '@makikidd', reps: 1146},
  {rank: 9, username: '@grantmurray', reps: 1056},
  {rank: 9, username: '@grantmurray', reps: 1056},
  {rank: 9, username: '@grantmurray', reps: 1056},
  {rank: 9, username: '@grantmurray', reps: 1056},
  {rank: 9, username: '@grantmurray', reps: 1056},
];

// 국가 표시는 제거됨

export default function LeaderboardScreen() {
  const navigation = useNavigation();
  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="오늘의 순위" onBackPress={() => navigation.goBack()} />

      <View style={styles.tableHeader}>
        <Text style={[styles.th, styles.thRank]}>순위</Text>
        <Text style={[styles.th, styles.thUser]}>닉네임</Text>
        <Text style={[styles.th, styles.thReps]}>푸쉬업 횟수</Text>
      </View>

      <FlatList
        data={MOCK_DATA}
        keyExtractor={item => String(item.rank)}
        contentContainerStyle={styles.listContent}
        renderItem={({item}) => (
          <View style={styles.row}>
            <Text style={[styles.cell, styles.cellRank]}>{item.rank}</Text>
            <View style={styles.cellUser}>
              <Image
                source={{
                  uri:
                    item.avatarUrl ||
                    'https://i.pravatar.cc/64?img=' + (item.rank + 10),
                }}
                style={styles.avatar}
              />
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
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.overlayDark,
  },
  username: {color: colors.textLight, fontSize: 14, fontWeight: '600'},
  // 국가 관련 스타일 제거됨
});
