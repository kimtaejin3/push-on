import React, {useState} from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import Fontawesome5 from '@react-native-vector-icons/fontawesome5';
import Fontawesome6 from '@react-native-vector-icons/fontawesome6';
import {Header, HeaderTitle} from '../components/common/Header';

function StatisticScreen() {
  const [selectedDate, setSelectedDate] = useState<string>('18');

  const dateItems = [
    {day: 'Mon', date: '12'},
    {day: 'Sat', date: '13'},
    {day: 'Sun', date: '14'},
    {day: 'Mon', date: '15'},
    {day: 'Tue', date: '16'},
    {day: 'Wed', date: '17'},
    {day: 'Thu', date: '18'},
  ];

  // 예시 세트 데이터
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
          <View style={styles.historyDates}>
            {dateItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.historyDateItem,
                  selectedDate === item.date && styles.selectedDateItem,
                ]}
                onPress={() => setSelectedDate(item.date)}>
                <Text style={styles.historyDateText}>{item.day}</Text>
                <View style={styles.historyDateNumber}>
                  <Text style={styles.historyDateNumberText}>{item.date}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

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
            <View style={styles.setsScrollView}>
              {setData.map((set, index) => renderSetCard(set, index))}
            </View>
          </View>
        </View>
      </View>
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
  historyDates: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  historyDateItem: {
    backgroundColor: '#9faab5',
    paddingVertical: 12,
    flex: 1,
    borderRadius: 9999,
    alignItems: 'center',
  },
  selectedDateItem: {
    backgroundColor: '#097eed',
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
  },
  historyDateNumberText: {
    color: '#000',
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
});

export default StatisticScreen;
