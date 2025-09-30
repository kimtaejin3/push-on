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

function formatDate(date: Date, delimiter: string) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}${delimiter}${month}${delimiter}${day}`;
}

function StatisticScreen() {
  const [selectedDate, setSelectedDate] = useState<string>(
    formatDate(new Date(), '-'),
  );
  const [selectedMonth, setSelectedMonth] = useState<number>(8); // 9월 (0-indexed)
  const [selectedYear, setSelectedYear] = useState<number>(2025);
  const [isCalendarModalVisible, setCalendarModalVisible] =
    useState<boolean>(false);

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
                color="#0182ff"
              />
            }
          />
        }
      />
      <View style={styles.monthSelector}>
        <TouchableOpacity
          style={styles.monthYearButton}
          onPress={() => setCalendarModalVisible(true)}>
          <Text style={styles.monthYearText}>
            {selectedYear}년 {monthNames[selectedMonth]} {selectedDate}일
          </Text>
          <Fontawesome5
            name="calendar-alt"
            iconStyle="solid"
            size={14}
            color="#0182ff"
            style={styles.calendarIcon}
          />
        </TouchableOpacity>
      </View>

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
        <DatePickerModal
          isVisible={isCalendarModalVisible}
          onClose={() => setCalendarModalVisible(false)}
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          onMonthSelect={month => setSelectedMonth(month)}
          onYearChange={year => setSelectedYear(year)}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  historyContainer: {
    borderRadius: 15,
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  monthYearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  monthYearText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  calendarIcon: {
    marginLeft: 8,
  },
  historySummary: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  historySummaryItem: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 10,
  },
  historySummaryTitle: {
    fontSize: 12,
    color: '#000',
  },
  historySummaryText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
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
});

export default StatisticScreen;
