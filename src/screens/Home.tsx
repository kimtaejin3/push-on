import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import CustomButton from '../components/common/CustomButton';
import Fontawesome5 from '@react-native-vector-icons/fontawesome5';
import {useState} from 'react';

function Home(): React.JSX.Element {
  const navigation = useNavigation();

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

          <View style={styles.historyContent}>
            <View style={styles.historyContentItem}>
              <Text>hi</Text>
            </View>
            <View style={styles.historyContentItem}>
              <Text>hi</Text>
            </View>
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
  historyContent: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  historyContentItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#e8e8e8',
    paddingVertical: 30,
    borderRadius: 15,
  },
});

export default Home;
