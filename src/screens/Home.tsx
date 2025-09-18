import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Animated,
} from 'react-native';
import CustomButton from '../components/common/CustomButton';
import Fontawesome5 from '@react-native-vector-icons/fontawesome5';
import {useState, useEffect, useRef} from 'react';

function Home(): React.JSX.Element {
  const navigation = useNavigation();

  const [selectedDate, setSelectedDate] = useState<string>('18');
  const [showSetDetails, setShowSetDetails] = useState<boolean>(true);
  const animatedHeight = useRef(new Animated.Value(0)).current;

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

  useEffect(() => {
    Animated.timing(animatedHeight, {
      toValue: showSetDetails ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [showSetDetails, animatedHeight]);

  const toggleSetDetails = () => {
    setShowSetDetails(!showSetDetails);
  };

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
            <View
              style={[
                styles.progressFill,
                {width: `${progressWidth}%`},
                set.isPersonalBest && styles.bestProgressFill,
              ]}
            />
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
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          {/* profile */}
          <View style={styles.profileContainer}>
            <Fontawesome5
              name="user"
              size={20}
              iconStyle="solid"
              color="#242424"
            />
          </View>
          <Fontawesome5
            name="bell"
            size={24}
            iconStyle="solid"
            color="#242424"
          />
        </View>

        <View style={styles.banner}>
          <Text style={styles.bannerText}>
            팔굽혀펴기 앱이 출시 되었습니다 🎉
          </Text>
          <Fontawesome5
            name="chevron-right"
            iconStyle="solid"
            size={15}
            color="#fff"
          />
        </View>

        <View style={styles.challengeContainer}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>최고 기록</Text>
            <View style={styles.recordContainer}>
              <View style={styles.recordItem}>
                <Fontawesome5
                  name="hashtag"
                  size={12}
                  iconStyle="solid"
                  color="#000"
                />
                <Text>총 횟수</Text>
                <Text>40번</Text>
              </View>
              <View style={styles.recordItem}>
                <Fontawesome5
                  name="clock"
                  size={12}
                  iconStyle="solid"
                  color="#000"
                />
                <Text>1분 40초</Text>
              </View>
            </View>
            <CustomButton
              title="푸쉬업 하기"
              onPress={() => navigation.navigate('Challenge')}
            />
          </View>
        </View>
        <View style={styles.historyContainer}>
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
            <TouchableOpacity
              style={[styles.historySummaryItem, styles.pushupCount]}
              onPress={toggleSetDetails}>
              <View>
                <Text style={styles.historySummaryTitle}>푸쉬업 수</Text>
                <Text style={styles.historySummaryText}>40번</Text>
              </View>
              <Fontawesome5
                name={showSetDetails ? 'chevron-up' : 'chevron-down'}
                iconStyle="solid"
                size={12}
                color="#666"
                style={styles.chevronIcon}
              />
            </TouchableOpacity>
            <View style={styles.historySummaryItem}>
              <Text style={styles.historySummaryTitle}>총 세트 수</Text>
              <Text style={styles.historySummaryText}>4세트</Text>
            </View>
            <View style={styles.historySummaryItem}>
              <Text style={styles.historySummaryTitle}>총 시간</Text>
              <Text style={styles.historySummaryText}>1분 40초</Text>
            </View>
          </View>

          <Animated.View
            style={[
              styles.setDetailsContainer,
              {
                opacity: animatedHeight,
                maxHeight: animatedHeight.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 600],
                }),
              },
            ]}>
            <View style={styles.setDetailsHeader}>
              <Fontawesome5
                name="dumbbell"
                iconStyle="solid"
                size={16}
                color="#242424"
              />
              <Text style={styles.setDetailsTitle}>세트별 상세 기록</Text>
            </View>
            <View style={styles.setsScrollView}>
              {setData.map((set, index) => renderSetCard(set, index))}
            </View>
          </Animated.View>
        </View>
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
  scrollContent: {
    flexGrow: 1,
  },
  card: {
    padding: 20,
    borderRadius: 15,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  cardText: {
    fontSize: 14,
    marginBottom: 20,
  },

  highlightGraph: {
    backgroundColor: '#000',
  },
  selectedGraph: {
    transform: [{scaleY: 1.2}],
  },
  challengeContainer: {
    marginTop: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    padding: 15,
    gap: 10,
    borderRadius: 9999,
  },
  recordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  recordItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  historyContainer: {
    marginTop: 20,
    backgroundColor: '#fff',
    paddingVertical: 20,
    paddingHorizontal: 10,
    borderRadius: 15,
  },
  historyDates: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  historyDateItem: {
    backgroundColor: '#c2c2c2',
    paddingVertical: 12,
    flex: 1,
    borderRadius: 9999,
    alignItems: 'center',
  },
  selectedDateItem: {
    backgroundColor: '#242424',
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
    // alignItems: 'center',
    backgroundColor: '#e8e8e8',
    // paddingVertical: 30,
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
  chevronIcon: {
    marginLeft: 5,
  },
  setDetailsContainer: {
    overflow: 'hidden',
    backgroundColor: '#fff',
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
    backgroundColor: '#f5f5f5',
    borderRadius: 15,
    marginBottom: 10,
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
    backgroundColor: '#3EB489',
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
    backgroundColor: '#c2c2c2',
    marginRight: 10,
  },
  progressFill: {
    height: 10,
    borderRadius: 9999,
    backgroundColor: '#242424',
  },
  bestProgressFill: {
    // backgroundColor: '#FFD700',
    backgroundColor: '#3EB489',
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
  pushupCount: {
    flexDirection: 'row',
  },
  banner: {
    backgroundColor: '#a7d1c2',
    padding: 20,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bannerText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
});

export default Home;
