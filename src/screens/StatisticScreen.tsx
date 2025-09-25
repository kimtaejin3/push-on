import React, {useState, useRef, useEffect, useCallback} from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  Modal,
  FlatList,
  Dimensions,
} from 'react-native';
import Fontawesome5 from '@react-native-vector-icons/fontawesome5';
import Fontawesome6 from '@react-native-vector-icons/fontawesome6';
import {Header, HeaderTitle} from '../components/common/Header';

const SCREEN_WIDTH = Dimensions.get('window').width;

function StatisticScreen() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedMonth, setSelectedMonth] = useState<number>(8); // 9월 (0-indexed)
  const [selectedYear, setSelectedYear] = useState<number>(2025);
  const [isCalendarModalVisible, setCalendarModalVisible] =
    useState<boolean>(false);
  const scrollViewRef = useRef<ScrollView>(null);

  console.log('check check check check', new Date());

  // 선택된 월의 날짜 데이터 생성
  const generateDatesForMonth = useCallback((year: number, month: number) => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    console.log('daysInMonth', daysInMonth, new Date(year, month + 1, 0));
    const dates = [];

    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];

    // 현재 월의 날짜 추가
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      console.log('date', date);
      const dayOfWeek = date.getDay();

      dates.push({
        day: dayNames[dayOfWeek],
        date: i,
        fullDate: date,
      });
    }

    return dates;
  }, []);

  // 현재 표시되는 날짜 데이터
  const [dateItems, setDateItems] = useState(
    generateDatesForMonth(selectedYear, selectedMonth),
  );

  const scrollToDate = useCallback((index: number) => {
    if (scrollViewRef.current) {
      const itemWidth = (SCREEN_WIDTH - 40) / 7; // 대략적인 아이템 너비
      scrollViewRef.current.scrollTo({
        x: Math.max(0, itemWidth * index - itemWidth * 3), // 선택된 날짜가 중앙에 오도록
        animated: true,
      });
    }
  }, []);

  // 월이 변경될 때 날짜 데이터 업데이트
  useEffect(() => {
    const newDates = generateDatesForMonth(selectedYear, selectedMonth);
    console.log('newDates', newDates);
    setDateItems(newDates);

    scrollToDate(selectedDate.getDate() + 1);
  }, [
    selectedMonth,
    selectedYear,
    generateDatesForMonth,
    selectedDate,
    scrollToDate,
  ]);

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

  const setData = [
    {
      setNumber: 1,
      reps: 12,
      time: '30초',
      restTime: '60초',
      isPersonalBest: true,
    },
    {
      setNumber: 2,
      reps: 10,
      time: '25초',
      restTime: '60초',
      isPersonalBest: false,
    },
    {
      setNumber: 3,
      reps: 8,
      time: '20초',
      restTime: '60초',
      isPersonalBest: false,
    },
    {
      setNumber: 4,
      reps: 10,
      time: '25초',
      restTime: '0초',
      isPersonalBest: false,
    },
  ];

  const maxReps = Math.max(...setData.map(set => set.reps));

  const renderSetCard = (set: any, index: number) => {
    const progressWidth = (set.reps / maxReps) * 100;

    return (
      <View key={index} style={styles.setCard}>
        <View style={styles.setHeader}>
          <View style={styles.setNumberContainer}>
            <Text style={styles.setNumber}>{set.setNumber}</Text>
          </View>
          <View style={styles.setInfo}>
            <View style={styles.setMainInfo}>
              <Text style={styles.setReps}>{set.reps}회</Text>
              <Text style={styles.setTime}>{set.time}</Text>
            </View>
            {set.isPersonalBest && (
              <View style={styles.bestBadge}>
                <Fontawesome5
                  name="crown"
                  iconStyle="solid"
                  size={10}
                  color="#fff"
                />
                <Text style={styles.bestText}>BEST</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, {width: `${progressWidth}%`}]} />
          </View>
          <Text style={styles.progressText}>{progressWidth.toFixed(0)}%</Text>
        </View>

        {set.restTime !== '0초' && (
          <View style={styles.restTimeContainer}>
            <Fontawesome5
              name="pause"
              iconStyle="solid"
              size={10}
              color="#666"
            />
            <Text style={styles.restTimeText}>휴식: {set.restTime}</Text>
          </View>
        )}
      </View>
    );
  };

  // 월 선택 모달
  const renderMonthPickerModal = () => {
    return (
      <Modal
        animationType="fade"
        transparent={true}
        visible={isCalendarModalVisible}
        onRequestClose={() => setCalendarModalVisible(false)}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setCalendarModalVisible(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>월 선택</Text>
            <FlatList
              data={monthNames}
              numColumns={3}
              renderItem={({item, index}) => (
                <TouchableOpacity
                  style={[
                    styles.monthItem,
                    selectedMonth === index && styles.selectedMonthItem,
                  ]}
                  onPress={() => {
                    setSelectedMonth(index);
                    setCalendarModalVisible(false);
                  }}>
                  <Text
                    style={[
                      styles.monthItemText,
                      selectedMonth === index && styles.selectedMonthItemText,
                    ]}>
                    {item}
                  </Text>
                </TouchableOpacity>
              )}
              keyExtractor={(_, index) => index.toString()}
            />
            <View style={styles.yearSelector}>
              <TouchableOpacity
                style={styles.yearButton}
                onPress={() => setSelectedYear(selectedYear - 1)}>
                <Fontawesome5
                  name="chevron-left"
                  iconStyle="solid"
                  size={16}
                  color="#0182ff"
                />
              </TouchableOpacity>
              <Text style={styles.yearText}>{selectedYear}년</Text>
              <TouchableOpacity
                style={styles.yearButton}
                onPress={() => setSelectedYear(selectedYear + 1)}>
                <Fontawesome5
                  name="chevron-right"
                  iconStyle="solid"
                  size={16}
                  color="#0182ff"
                />
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    );
  };

  return (
    <View style={styles.safeArea}>
      <View style={styles.headerContainer}>
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
      </View>
      <View style={styles.historyContainer}>
        <View style={styles.historyContent}>
          {/* 월 선택 헤더 */}
          <View style={styles.monthSelector}>
            <TouchableOpacity
              style={styles.monthYearButton}
              onPress={() => setCalendarModalVisible(true)}>
              <Text style={styles.monthYearText}>
                {selectedYear}년 {monthNames[selectedMonth]}
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

          {/* 날짜 선택 스크롤뷰 */}
          <ScrollView
            ref={scrollViewRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.dateScrollContainer}>
            {dateItems.map((item, index) => {
              const isSelected = new Date() === item.fullDate;

              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.historyDateItem,
                    isSelected && styles.selectedDateItem,
                  ]}
                  onPress={() => setSelectedDate(item.fullDate)}>
                  <Text style={styles.historyDateText}>{item.day}</Text>
                  <View style={styles.historyDateNumber}>
                    <Text style={styles.historyDateNumberText}>
                      {item.date}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

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
            <ScrollView style={styles.setsScrollView}>
              {setData.map((set, index) => renderSetCard(set, index))}
            </ScrollView>
          </View>
        </View>
      </View>
      {renderMonthPickerModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#f5f5f5',
    padding: 10,
  },
  historyContainer: {
    borderRadius: 15,
  },
  historyContent: {
    paddingHorizontal: 10,
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    marginBottom: 10,
  },
  monthYearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 10,
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
  dateScrollContainer: {
    paddingVertical: 10,
    paddingHorizontal: 5,
  },
  historyDates: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  historyDateItem: {
    backgroundColor: '#9faab5',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 9999,
    alignItems: 'center',
    marginHorizontal: 5,
    width: 45,
  },
  emptyDateItem: {
    backgroundColor: '#fff',
  },
  selectedDateItem: {
    backgroundColor: '#097eed',
    color: '#fff',
  },
  historyDateText: {
    color: '#fff',
    fontSize: 12,
  },
  historyDateNumber: {
    backgroundColor: '#fff',
    padding: 5,
    borderRadius: 9999,
    alignItems: 'center',
    marginTop: 5,
    width: 25,
    height: 25,
    justifyContent: 'center',
  },
  historyDateNumberText: {
    color: '#000',
    fontSize: 12,
  },
  todayDateNumberText: {
    fontWeight: 'bold',
    color: '#0182ff',
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
  pushupCount: {
    flexDirection: 'row',
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
  chevronIcon: {
    marginLeft: 5,
  },
  setDetailsContainer: {
    overflow: 'hidden',
    borderRadius: 15,
    padding: 10,
    marginTop: 10,
  },
  setDetailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  setDetailsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  setsScrollView: {
    maxHeight: 'auto',
  },
  setCard: {
    padding: 15,
    borderRadius: 15,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  setHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  setNumberContainer: {
    backgroundColor: '#fff',
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    width: 20,
    height: 20,
    marginRight: 5,
  },
  setNumber: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  setInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
  },
  setMainInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  setReps: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  setTime: {
    fontSize: 12,
    color: '#666',
  },
  bestBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#097eed',
    padding: 2,
    borderRadius: 9999,
  },
  bestText: {
    fontSize: 10,
    color: '#fff',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  progressBar: {
    flex: 1,
    height: 10,
    borderRadius: 9999,
    backgroundColor: '#e6e6e6',
    marginRight: 10,
  },
  progressFill: {
    height: 10,
    borderRadius: 9999,
    backgroundColor: '#549de3',
  },
  progressText: {
    fontSize: 12,
    color: '#666',
  },
  restTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  restTimeText: {
    fontSize: 12,
    color: '#666',
  },
  headerContainer: {
    padding: 10,
  },
  historyDetails: {
    marginTop: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    width: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  monthItem: {
    width: '33%',
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedMonthItem: {
    backgroundColor: '#0182ff',
    borderRadius: 5,
  },
  monthItemText: {
    fontSize: 16,
  },
  selectedMonthItemText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  yearSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  yearButton: {
    padding: 10,
  },
  yearText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginHorizontal: 10,
  },
});

export default StatisticScreen;
