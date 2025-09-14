import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {StyleSheet, Text, View, TouchableOpacity} from 'react-native';
import CustomButton from '../components/common/CustomButton';
import {useState} from 'react';

const graphData = [
  {id: 'sixDaysAgo', height: 100, date: '6일전'},
  {id: 'fiveDaysAgo', height: 150, date: '5일전'},
  {id: 'fourDaysAgo', height: 80, date: '4일전'},
  {id: 'threeDaysAgo', height: 120, date: '3일전'},
  {id: 'twoDaysAgo', height: 90, date: '2일전'},
  {id: 'yesterday', height: 140, date: '1일전'},
  {id: 'today', height: 170, highlight: true, date: '오늘'},
];

function Home(): React.JSX.Element {
  const navigation = useNavigation();

  const [selectedBarIndex, setSelectedBarIndex] =
    useState<(typeof graphData)[0]['id']>('today');

  return (
    <SafeAreaView style={styles.safeArea}>
      <View>
        <Text style={styles.title}>나의 푸쉬업 데이터</Text>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    padding: 20,
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
    backgroundColor: '#FF6969',
  },
  selectedGraph: {
    transform: [{scaleY: 1.2}],
  },
  challengeContainer: {
    marginTop: 40,
  },
});

export default Home;
