import React, {Suspense, useState} from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useAtom} from 'jotai';
import Fontawesome5 from '@react-native-vector-icons/fontawesome5';
import DatePickerModal from '../components/common/DatePickerModal';
import {colors} from '../constants/colors';
import SetCard from '../components/features/push-up/SetCard';
import HistorySummary from '../components/features/push-up/HistorySummary';
import {useAuth} from '../hooks/useAuth';
import {
  CURRENT_DATE,
  CURRENT_MONTH,
  CURRENT_YEAR,
  selectedDateAtom,
  updateSelectedDateAtom,
} from '../atoms/statistics';
import {useSuspenseQuery, useQuery} from '@tanstack/react-query';
import {
  pushUpSetsByDateQueryOptions,
  profileQueryOptions,
} from '../tanstack-query';

function getDayOfWeek(date: Date) {
  const days = [
    '일요일',
    '월요일',
    '화요일',
    '수요일',
    '목요일',
    '금요일',
    '토요일',
  ];
  return days[date.getDay()];
}

function HistoryScreen() {
  const [selectedDate] = useAtom(selectedDateAtom);
  const [, updateSelectedDate] = useAtom(updateSelectedDateAtom);

  const [isCalendarModalVisible, setCalendarModalVisible] =
    useState<boolean>(false);

  // 날짜 변경 함수들
  const goToPreviousDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    updateSelectedDate(newDate);
  };

  const goToNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    updateSelectedDate(newDate);
  };

  // 스와이프 제스처 처리
  // 월 이름 배열
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

  const isNextButtonDisabled =
    selectedDate.getDate() === CURRENT_DATE &&
    selectedDate.getMonth() + 1 === CURRENT_MONTH &&
    selectedDate.getFullYear() === CURRENT_YEAR;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.scrollContainer}>
        <ScrollView style={styles.scrollView}>
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
        <View style={styles.dateNavigationContainer}>
          <TouchableOpacity style={styles.navButton} onPress={goToPreviousDay}>
            <Fontawesome5
              name="chevron-left"
              iconStyle="solid"
              size={16}
              color={colors.primary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.dateDisplay}
            onPress={() => setCalendarModalVisible(true)}>
            <Text style={styles.dateText}>
              {selectedDate.getFullYear()}년{' '}
              {monthNames[selectedDate.getMonth()]} {selectedDate.getDate()}일
            </Text>
            <Text style={styles.dayOfWeekText}>
              {getDayOfWeek(selectedDate)}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            disabled={isNextButtonDisabled}
            style={[
              styles.navButton,
              isNextButtonDisabled && styles.disabledButton,
            ]}
            onPress={goToNextDay}>
            <Fontawesome5
              name="chevron-right"
              iconStyle="solid"
              size={16}
              color={colors.primary}
            />
          </TouchableOpacity>
        </View>
        <DatePickerModal
          isVisible={isCalendarModalVisible}
          onClose={() => setCalendarModalVisible(false)}
          onChangeSelectedDate={(date: Date) => updateSelectedDate(date)}
        />
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
  scrollView: {
    flex: 1,
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
  scrollContainer: {
    flex: 1,
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
});

export default HistoryScreen;
