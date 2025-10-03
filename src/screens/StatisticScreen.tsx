import React, {useState} from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Fontawesome5 from '@react-native-vector-icons/fontawesome5';
import Fontawesome6 from '@react-native-vector-icons/fontawesome6';
import {Header, HeaderTitle} from '../components/common/Header';
import SetCard, {SetData} from '../components/SetCard';
import DatePickerModal from '../components/DatePickerModal';
import {colors} from '../constants/colors';

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

function StatisticScreen() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isCalendarModalVisible, setCalendarModalVisible] =
    useState<boolean>(false);

  // 날짜 변경 함수들
  const goToPreviousDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    setSelectedDate(newDate);
  };

  const goToNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    setSelectedDate(newDate);
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

  const setData: SetData[] = [
    {
      setNumber: 1,
      reps: 12,
      time: '30초',
      isPersonalBest: true,
    },
    {
      setNumber: 2,
      reps: 10,
      time: '25초',
      isPersonalBest: false,
    },
    {
      setNumber: 3,
      reps: 8,
      time: '20초',
      isPersonalBest: false,
    },
    {
      setNumber: 4,
      reps: 10,
      time: '25초',
      isPersonalBest: false,
    },
    {
      setNumber: 4,
      reps: 10,
      time: '25초',
      isPersonalBest: false,
    },
    {
      setNumber: 4,
      reps: 10,
      time: '25초',
      isPersonalBest: false,
    },
    {
      setNumber: 4,
      reps: 10,
      time: '25초',
      isPersonalBest: false,
    },
  ];

  const maxReps = Math.max(...setData.map(set => set.reps));

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        left={
          <HeaderTitle
            title="일자별 푸쉬업 기록"
            icon={
              <Fontawesome6
                name="chart-simple"
                size={18}
                iconStyle="solid"
                color={colors.primary}
              />
            }
          />
        }
      />

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
            {selectedDate.getFullYear()}년 {monthNames[selectedDate.getMonth()]}{' '}
            {selectedDate.getDate()}일
          </Text>
          <Text style={styles.dayOfWeekText}>{getDayOfWeek(selectedDate)}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          disabled={selectedDate.getDate() === new Date().getDate()}
          style={[
            styles.navButton,
            selectedDate.getDate() === new Date().getDate() &&
              styles.disabledButton,
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

      <View style={styles.scrollContainer}>
        <ScrollView style={styles.scrollView}>
          <View style={styles.historyContainer}>
            <View>
              {/* 월 선택 헤더 */}

              <View style={styles.historySummary}>
                <View style={styles.historySummaryItem}>
                  <View>
                    <Text style={styles.historySummaryTitle}>푸쉬업 수</Text>
                    <Text style={styles.historySummaryText}>40번</Text>
                  </View>
                </View>
                <View style={styles.historySummaryItem}>
                  <Text style={styles.historySummaryTitle}>총 세트 수</Text>
                  <Text style={styles.historySummaryText}>4세트</Text>
                </View>
                <View style={styles.historySummaryItem}>
                  <Text style={styles.historySummaryTitle}>총 시간</Text>
                  <Text style={styles.historySummaryText}>1분 40초</Text>
                </View>
              </View>
              <View style={styles.historyDetails}>
                <View style={styles.setDetailsHeader}>
                  <Text style={styles.setDetailsTitle}>세트별 상세 기록</Text>
                </View>
                {setData.map((set, index) => (
                  <SetCard key={index} set={set} maxReps={maxReps} />
                ))}
              </View>
            </View>
          </View>
        </ScrollView>
        <DatePickerModal
          isVisible={isCalendarModalVisible}
          onClose={() => setCalendarModalVisible(false)}
          selectedMonth={selectedDate.getMonth()}
          selectedYear={selectedDate.getFullYear()}
          onMonthSelect={month => {
            const newDate = new Date(selectedDate);
            newDate.setMonth(month);
            setSelectedDate(newDate);
          }}
          onYearChange={year => {
            const newDate = new Date(selectedDate);
            newDate.setFullYear(year);
            setSelectedDate(newDate);
          }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    padding: 20,
    backgroundColor: colors.backgroundLight,
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
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gray100,
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
    color: colors.textPrimary,
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
  historySummary: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  historySummaryItem: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 15,
    padding: 10,
  },
  historySummaryTitle: {
    fontSize: 12,
    color: colors.textBlack,
  },
  historySummaryText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.textBlack,
  },
  setDetailsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  headerContainer: {
    paddingHorizontal: 10,
    paddingTop: 10,
  },
  historyDetails: {
    marginTop: 20,
  },
  setDetailsHeader: {
    marginTop: 10,
    marginBottom: 20,
  },
  disabledButton: {
    opacity: 0.4,
  },
});

export default StatisticScreen;
