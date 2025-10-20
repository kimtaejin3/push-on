import React, {Suspense} from 'react';
import {StyleSheet, Text, View, ScrollView} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useAtom} from 'jotai';
import Fontawesome5 from '@react-native-vector-icons/fontawesome5';
import Calendar from '../components/features/calendar/Calendar';
import {colors} from '../constants/colors';
import SetCard from '../components/features/push-up/SetCard';
import HistorySummary from '../components/features/push-up/HistorySummary';
import {useAuth} from '../hooks/useAuth';
import {selectedDateAtom} from '../atoms/statistics';
import {useSuspenseQuery, useQuery} from '@tanstack/react-query';
import {
  pushUpSetsByDateQueryOptions,
  profileQueryOptions,
} from '../tanstack-query';

function HistoryScreen() {
  const [selectedDate] = useAtom(selectedDateAtom);

  const monthNames = [
    '1월',
    '2월',
    '3월',
    '4월',
    '5월',
    '6월',
    '7월',
    '8월',
    '9월',
    '10월',
    '11월',
    '12월',
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.scrollContainer}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}>
          <Calendar selectedDate={selectedDate} />
          <View style={styles.historyContainer}>
            <View>
              <View style={styles.sectionHeader}>
                <Text style={styles.setDetailsTitle}>
                  {selectedDate.getFullYear()}년{' '}
                  {monthNames[selectedDate.getMonth()]} {selectedDate.getDate()}
                  일 푸쉬업 요약
                </Text>
              </View>
              <HistorySummary />
              <View style={styles.sectionHeader}>
                <Text style={styles.setDetailsTitle}>세트별 상세 기록</Text>
              </View>
              <Suspense fallback={<Text>Loading</Text>}>
                <SetCardList />
              </Suspense>
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

function SetCardList() {
  const [selectedDate] = useAtom(selectedDateAtom);
  const {year, month, day} = {
    year: selectedDate.getFullYear(),
    month: selectedDate.getMonth() + 1,
    day: selectedDate.getDate(),
  };

  const {user} = useAuth();

  const {data: pushupSets} = useSuspenseQuery(
    pushUpSetsByDateQueryOptions(year, month, day),
  );
  const {data: profile} = useQuery({
    ...profileQueryOptions(user?.id || ''),
    enabled: user !== null,
  });

  if (pushupSets.length === 0) {
    return (
      <View style={styles.noDataContainer}>
        <Fontawesome5 name="frown" size={24} color={colors.gray600} />
        <Text style={styles.noDataText}>푸쉬업 기록이 없어요</Text>
      </View>
    );
  }

  return (
    <View>
      {pushupSets.map((set, index) => (
        <SetCard
          key={index}
          set={{
            setNumber: index + 1,
            reps: set.reps,
            time: set.duration_seconds.toString(),
          }}
          targetReps={profile?.target_reps_per_set || 0}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    padding: 20,
    backgroundColor: colors.backgroundDark,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 50,
  },
  historyContainer: {
    borderRadius: 15,
  },
  dateNavigationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 40,
    paddingHorizontal: 10,
    paddingTop: 8,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.overlayLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateDisplay: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  dateText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textLight,
    marginBottom: 2,
  },
  dayOfWeekText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  calendarIcon: {
    marginTop: 2,
  },
  todayButton: {
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.primary,
    marginBottom: 15,
  },
  todayButtonText: {
    color: colors.textLight,
    fontSize: 14,
    fontWeight: 'bold',
  },

  setDetailsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 5,
    color: colors.textLight,
  },
  headerContainer: {
    paddingHorizontal: 10,
    paddingTop: 10,
  },
  sectionHeader: {
    marginTop: 10,
    marginBottom: 20,
  },
  disabledButton: {
    opacity: 0.4,
  },
  noDataContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    backgroundColor: colors.overlayLight,
    borderRadius: 15,
  },
  noDataText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.gray600,
    marginTop: 20,
  },
});

export default HistoryScreen;
