import React, {useState} from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {useQuery} from '@tanstack/react-query';
import {Crown} from 'lucide-react-native';
import {NativeAdCard} from '../components/ads/NativeAdCard';
import {Button} from '../components/ui/Button';
import {Icon} from '../components/ui/Icon';
import {ScreenHeader} from '../components/ui/ScreenHeader';
import {SegmentedControl} from '../components/ui/SegmentedControl';
import {Text} from '../components/ui/Text';
import {BottomSheet} from '../components/ui/feedback/BottomSheet';
import {EmptyState} from '../components/ui/feedback/EmptyState';
import {ErrorState} from '../components/ui/feedback/ErrorState';
import {Skeleton} from '../components/ui/feedback/Skeleton';
import {NATIVE_LEADERBOARD_AD_UNIT_ID} from '../constants/ads';
import {useNow} from '../hooks/useNow';
import {useSession} from '../hooks/useSession';
import type {LeaderboardItem} from '../remote/pushup';
import {
  dailyLeaderboardQueryOptions,
  monthlyLeaderboardQueryOptions,
  yearlyLeaderboardQueryOptions,
} from '../tanstack-query';
import {color, layout, radius, space} from '../theme';

const modes = [
  {key: 'daily', label: '오늘'},
  {key: 'monthly', label: '이번 달'},
  {key: 'yearly', label: '올해'},
];
// 1~3위 메달 색은 기존 화면 그대로 둔다(테마 토큰에 메달 색이 없어 여기서만 쓴다)
const medals = ['#FFD700', '#C0C0C0', '#CD7F32'];
// 이 순위 다음에 광고를 끼운다. 순위가 이보다 많을 때만 (목록 끝에는 붙이지 않는다)
const AD_AFTER_RANK = 10;
const kstDate = new Intl.DateTimeFormat('ko-KR', {
  timeZone: 'Asia/Seoul',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

function LeaderboardSkeleton() {
  return (
    <View
      accessibilityLabel="순위를 불러오는 중"
      accessibilityState={{busy: true}}>
      {Array.from({length: 6}, (_, index) => (
        <View style={styles.row} key={index}>
          <Skeleton width={28} height={22} />
          <Skeleton width={36} height={36} radius={radius.pill} />
          <View style={styles.name}>
            <Skeleton width={108} height={14} />
          </View>
          <Skeleton width={42} height={24} />
        </View>
      ))}
    </View>
  );
}

export default function LeaderboardScreen() {
  const navigation = useNavigation();
  const {user} = useSession();
  const {now} = useNow();
  const [period, setPeriod] = useState('daily');
  const [showRules, setShowRules] = useState(false);

  const parts = kstDate.formatToParts(now);
  const year = parts.find(part => part.type === 'year')!.value;
  const month = parts.find(part => part.type === 'month')!.value;
  const day = parts.find(part => part.type === 'day')!.value;
  const periods = {
    daily: {
      options: dailyLeaderboardQueryOptions(`${year}-${month}-${day}`),
      label: `${Number(month)}월 ${Number(day)}일 · 하루 총 개수`,
    },
    monthly: {
      options: monthlyLeaderboardQueryOptions(Number(year), Number(month)),
      label: `${year}년 ${Number(month)}월 · 이번 달 총 개수`,
    },
    yearly: {
      options: yearlyLeaderboardQueryOptions(Number(year)),
      label: `${year}년 · 올해 총 개수`,
    },
  };
  const {options, label} = periods[period as keyof typeof periods];
  const query = useQuery<LeaderboardItem[]>(options);
  const items = query.data ?? [];
  const refresh = () => {
    query.refetch();
  };
  const closeRules = () => setShowRules(false);

  return (
    <SafeAreaView style={styles.screen}>
      <ScreenHeader
        title="리더보드"
        onBack={() => navigation.goBack()}
        right={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="순위 기준"
            onPress={() => setShowRules(true)}
            style={({pressed}) => [styles.info, pressed && styles.pressed]}>
            <Icon name="info" size={22} />
          </Pressable>
        }
      />
      <View style={styles.segments}>
        <SegmentedControl options={modes} value={period} onChange={setPeriod} />
      </View>

      <FlatList
        key={period}
        data={items}
        keyExtractor={item => item.user_id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={query.isRefetching}
            onRefresh={refresh}
            tintColor={color.active}
            colors={[color.active]}
          />
        }
        ListHeaderComponent={
          query.isPending ? (
            <Skeleton width={150} height={14} />
          ) : query.data ? (
            <Text variant="label" color="textMuted" weight={700}>
              {label}
            </Text>
          ) : null
        }
        ListEmptyComponent={
          <View style={[styles.empty, !query.isPending && styles.centered]}>
            {query.isPending ? (
              <LeaderboardSkeleton />
            ) : query.isError ? (
              <ErrorState
                title="순위를 불러오지 못했어요"
                message="연결을 확인하고 다시 시도해 주세요."
                actionLabel="다시 시도"
                onAction={refresh}
              />
            ) : period === 'daily' ? (
              <>
                <EmptyState
                  title="오늘 첫 기록의 주인공이 되어 보세요"
                  message={
                    '0시에 새로 시작했어요.\n아직 아무도 기록하지 않았어요.'
                  }
                  actionLabel="오늘 운동 시작"
                  onAction={() => navigation.navigate('Challenge')}
                />
                <Button
                  variant="text"
                  title="이번 달 순위 보기"
                  icon="chevron-right"
                  onPress={() => setPeriod('monthly')}
                />
              </>
            ) : (
              <EmptyState
                title="아직 기록이 없어요"
                message="이 기간에는 아무도 기록하지 않았어요."
              />
            )}
          </View>
        }
        renderItem={({item, index}) => {
          const rank = index + 1;
          const name = item.nickname?.trim() || '익명';
          const initial = Array.from(name)[0].toUpperCase();
          const isMe = item.user_id === user?.id;
          const medal = medals[index];
          const adAfter =
            rank === AD_AFTER_RANK && items.length > AD_AFTER_RANK;
          const row = (
            <View style={[styles.row, isMe && styles.ownRow]}>
              <Text
                numeric
                weight={800}
                color={medal ? 'record' : isMe ? 'active' : 'textMuted'}
                style={styles.rank}>
                {rank}
              </Text>
              <View
                style={[
                  styles.avatar,
                  isMe && styles.ownAvatar,
                  medal && styles.medal,
                  medal && {borderColor: medal},
                ]}>
                <Text variant="label" weight={700}>
                  {initial}
                </Text>
                {rank === 1 && (
                  <View style={styles.crown}>
                    <Crown color={medal} size={16} accessible={false} />
                  </View>
                )}
              </View>
              <View style={styles.name}>
                <Text weight={700}>
                  {name}
                  {isMe ? ' (나)' : ''}
                </Text>
              </View>
              <View style={styles.count}>
                <Text numeric weight={800} style={styles.reps}>
                  {item.total_reps.toLocaleString()}
                </Text>
                <Text variant="caption" color="textMuted" weight={600}>
                  개
                </Text>
              </View>
            </View>
          );
          if (!adAfter) {
            return row;
          }
          // 10위 다음, 11위 앞. 광고가 꺼졌거나 실패하면 null 이라 간격 없이 11위가 바로 이어진다
          return (
            <>
              {row}
              <NativeAdCard
                unitId={NATIVE_LEADERBOARD_AD_UNIT_ID}
                style={styles.ad}
              />
            </>
          );
        }}
      />

      <BottomSheet
        visible={showRules}
        title="순위는 이렇게 정해요"
        onClose={closeRules}>
        <Text variant="label" color="textMuted" style={styles.rules}>
          오늘 탭은 하루 총 개수로 줄 세워요. 한국 시간 0시에 새로 시작해요.
          {'\n'}이번 달 · 올해 탭은 그 기간 합계예요.
        </Text>
        <Button variant="primary" title="알겠어요" onPress={closeRules} />
      </BottomSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: color.bg},
  info: {
    width: layout.touchMin,
    height: layout.touchMin,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {opacity: 0.7},
  segments: {paddingHorizontal: layout.screenPadding, paddingTop: space[8]},
  list: {
    flexGrow: 1,
    paddingHorizontal: layout.screenPadding,
    paddingTop: space[16],
    paddingBottom: space[24],
  },
  empty: {marginTop: space[16], flex: 1},
  centered: {justifyContent: 'center'},
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 60,
    paddingVertical: space[8],
    gap: space[12],
    borderBottomWidth: 1,
    borderBottomColor: color.border,
  },
  ownRow: {
    backgroundColor: color.activeSoft,
    borderRadius: radius.m,
    borderBottomWidth: 0,
  },
  rank: {width: 28, textAlign: 'center', fontSize: 22, lineHeight: 26},
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: color.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  medal: {borderWidth: 2},
  ownAvatar: {backgroundColor: color.activeFill},
  crown: {position: 'absolute', right: -6, top: -8},
  name: {flex: 1},
  count: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
    paddingRight: 2,
  },
  reps: {fontSize: 24, lineHeight: 28},
  rules: {marginBottom: space[12]},
  ad: {marginVertical: space[32]},
});
