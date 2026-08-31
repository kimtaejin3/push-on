import React, {useState} from 'react';
import {SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useQuery} from '@tanstack/react-query';
import Header from '../components/common/Header';
import {colors} from '../constants/colors';
import {useSession} from '../hooks/useSession';
import {activeProgramQueryOptions} from '../tanstack-query';
import {toProgramState} from '../remote/program';
import {Level, programTable} from '../domain/hundredPushups';

const LEVELS: Level[] = [1, 2, 3];

/** 주차·레벨별 전체 세트 표 */
function ProgramTableScreen() {
  const navigation = useNavigation();
  const {user} = useSession();
  const {data: programRow} = useQuery(activeProgramQueryOptions(user?.id ?? ''));
  const current = programRow ? toProgramState(programRow) : null;

  const [level, setLevel] = useState<Level>(current?.level ?? 1);
  const table = programTable(level);
  const isCurrentLevel = current?.level === level;

  return (
    <SafeAreaView style={styles.container}>
      <Header title="전체 프로그램" onBackPress={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.segments}>
          {LEVELS.map(l => {
            const active = level === l;
            return (
              <TouchableOpacity
                key={l}
                style={[styles.segment, active && styles.segmentActive]}
                onPress={() => setLevel(l)}>
                <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
                  레벨 {l}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <Text style={styles.caption}>
          초기 테스트 결과로 레벨이 정해져요.{'\n'}마지막 세트(+)는 최소 횟수 이상 가능한 만큼 해요.
        </Text>

        {table.map(week => {
          const isCurrentWeek = isCurrentLevel && current?.week === week.week;
          return (
            <View key={week.week} style={[styles.weekCard, isCurrentWeek && styles.weekCardCurrent]}>
              <View style={styles.weekHeader}>
                <Text style={styles.weekTitle}>{week.week}주차</Text>
                {week.hasTest && <Text style={styles.testBadge}>끝나면 테스트</Text>}
              </View>
              {week.days.map(day => {
                const isCurrentDay = isCurrentWeek && current?.day === day.day && !current?.testDue;
                return (
                  <View key={day.day} style={styles.dayRow}>
                    <Text style={[styles.dayLabel, isCurrentDay && styles.currentText]}>
                      Day {day.day}
                      {isCurrentDay ? ' ·' : ''}
                    </Text>
                    <View style={styles.dayRight}>
                      <Text style={[styles.daySets, isCurrentDay && styles.currentText]}>
                        {day.sets}
                      </Text>
                      <Text style={styles.dayRest}>휴식 {day.restSeconds}초</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          );
        })}

        <Text style={styles.caption}>
          테스트 결과가 다음 주차 기준에 못 미치면 같은 주차를 반복해요.{'\n'}그래서 걸리는 기간은 사람마다 달라요.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.backgroundDark},
  content: {padding: 20, gap: 12, paddingBottom: 40},
  segments: {
    flexDirection: 'row',
    backgroundColor: colors.overlayLight,
    borderRadius: 12,
    padding: 4,
  },
  segment: {flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center'},
  segmentActive: {backgroundColor: colors.primaryDark},
  segmentText: {fontSize: 14, fontWeight: '600', color: colors.textSecondary},
  segmentTextActive: {color: colors.textLight},
  caption: {fontSize: 13, lineHeight: 19, color: colors.gray400},
  weekCard: {
    backgroundColor: colors.overlayLight,
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  weekCardCurrent: {borderWidth: 1, borderColor: colors.primary},
  weekHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  weekTitle: {fontSize: 16, fontWeight: '600', color: colors.textLight},
  testBadge: {fontSize: 12, color: colors.primaryLight},
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  dayLabel: {fontSize: 14, color: colors.textSecondary},
  dayRight: {alignItems: 'flex-end', gap: 2},
  daySets: {fontSize: 15, fontWeight: '600', color: colors.textLight},
  dayRest: {fontSize: 12, color: colors.gray400},
  currentText: {color: colors.primaryLight},
});

export default ProgramTableScreen;
