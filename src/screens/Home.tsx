import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import CustomButton from '../components/common/CustomButton';
import {useState} from 'react';

const graphData = [
  {id: 'sixDaysAgo', height: 100, date: '9/8'},
  {id: 'fiveDaysAgo', height: 150, date: '9/9'},
  {id: 'fourDaysAgo', height: 80, date: '9/10'},
  {id: 'threeDaysAgo', height: 120, date: '9/11'},
  {id: 'twoDaysAgo', height: 90, date: '9/12'},
  {id: 'yesterday', height: 140, date: '9/13'},
  {id: 'today', height: 170, highlight: true, date: '9/14'},
];

function Home(): React.JSX.Element {
  const navigation = useNavigation();

  const [selectedBarIndex, setSelectedBarIndex] =
    useState<(typeof graphData)[0]['id']>('today');

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        <View>
          <Text style={styles.title}>25년 9월 14일</Text>
          <View style={styles.graphContainer}>
            {graphData.map((item, _) => (
              <View style={styles.graphItem} key={item.date}>
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.graph,
                    {height: item.height},
                    selectedBarIndex === item.id && styles.highlightGraph,
                  ]}
                  onPress={() => setSelectedBarIndex(item.id)}
                />
                <Text style={styles.graphDate}>{item.date}</Text>
              </View>
            ))}
          </View>
        </View>
        <View style={styles.dateStatisticsContainer}>
          {/* <Text style={styles.dateStatisticsTitle}>s</Text> */}

          <View style={styles.dateStatistics}>
            {/* 총 세트 */}
            <View style={styles.dateStatisticsItem}>
              <Text style={styles.dateStatisticsTitle}>Set</Text>
              <Text style={styles.dateStatisticsValue}>10세트</Text>
            </View>
            {/* 총 횟수 */}
            <View style={styles.dateStatisticsItem}>
              <Text style={styles.dateStatisticsTitle}>Count</Text>
              <Text style={styles.dateStatisticsValue}>100회</Text>
            </View>
            {/* 총 수행시간 */}
            <View style={styles.dateStatisticsItem}>
              <Text style={styles.dateStatisticsTitle}>Time</Text>
              <Text style={styles.dateStatisticsValue}>1분 40초</Text>
            </View>
          </View>
          <View style={styles.setStatistics}>
            <View style={styles.setStatisticsItem}>
              <Text>Set 1</Text>
              <Text>10회</Text>
              <Text>1분 40초</Text>
            </View>
            <View style={styles.setStatisticsItem}>
              <Text>Set 2</Text>
              <Text>10회</Text>
              <Text>1분 40초</Text>
            </View>
            <View style={styles.setStatisticsItem}>
              <Text>Set 3</Text>
              <Text>10회</Text>
              <Text>1분 40초</Text>
            </View>
            <View style={styles.setStatisticsItem}>
              <Text>Set 4</Text>
              <Text>10회</Text>
              <Text>1분 40초</Text>
            </View>
          </View>
        </View>
        <View style={styles.challengeContainer}>
          <Text style={styles.title}>한번에 챌린지</Text>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>최고 기록</Text>
            <Text style={styles.cardText}>
              총 횟수: 40번 / 총 수행시간: 1분 40초
            </Text>
            <CustomButton
              title="챌린지 시작하기"
              onPress={() => navigation.navigate('Challenge')}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    padding: 20,
  },
  scrollContent: {
    flexGrow: 1,
  },
  card: {
    padding: 20,
    borderWidth: 1,
    borderColor: '#EBEBEB',
    borderRadius: 15,
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
  graphContainer: {
    flexDirection: 'row',
    gap: 15,
    alignItems: 'flex-end',
    height: 200,
  },
  graphItem: {
    flex: 1,
    alignItems: 'center',
    flexDirection: 'column',
    gap: 10,
  },
  graph: {
    width: '100%',
    height: 200,
    backgroundColor: '#EBEBEB',
    borderRadius: 15,
  },
  graphDate: {
    fontSize: 11,
  },
  highlightGraph: {
    backgroundColor: '#000',
  },
  selectedGraph: {
    transform: [{scaleY: 1.2}],
  },
  challengeContainer: {
    marginTop: 40,
  },
  dateStatisticsContainer: {
    marginTop: 20,
  },
  dateStatistics: {
    flexDirection: 'row',
    gap: 15,
    alignItems: 'center',
    marginTop: 20,
  },
  dateStatisticsItem: {
    alignItems: 'center',
    borderColor: '#000',
    borderWidth: 0.3,
    paddingVertical: 20,
    borderRadius: 15,
    flex: 1,
  },
  dateStatisticsTitle: {
    fontSize: 15,
    marginBottom: 10,
  },
  dateStatisticsValue: {
    fontWeight: 'bold',
    fontSize: 13,
  },
  setStatistics: {
    flexDirection: 'column',
    gap: 15,
    marginTop: 30,
  },
  setStatisticsItem: {
    flexDirection: 'row',
    borderColor: '#aaa',
    justifyContent: 'space-between',
    borderBottomWidth: 0.3,
    paddingBottom: 10,
  },
});

export default Home;
