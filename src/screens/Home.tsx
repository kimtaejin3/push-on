import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {StyleSheet, Text, View, ScrollView} from 'react-native';
import CustomButton from '../components/common/CustomButton';
import Fontawesome5 from '@react-native-vector-icons/fontawesome5';

function Home(): React.JSX.Element {
  const navigation = useNavigation();

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
            <View style={styles.historyDateItem}>
              <Text style={styles.historyDateText}>Mon</Text>
              <View style={styles.historyDateNumber}>
                <Text style={styles.historyDateNumberText}>12</Text>
              </View>
            </View>
            <View style={styles.historyDateItem}>
              <Text style={styles.historyDateText}>Sat</Text>
              <View style={styles.historyDateNumber}>
                <Text style={styles.historyDateNumberText}>13</Text>
              </View>
            </View>
            <View style={styles.historyDateItem}>
              <Text style={styles.historyDateText}>Sun</Text>
              <View style={styles.historyDateNumber}>
                <Text style={styles.historyDateNumberText}>14</Text>
              </View>
            </View>
            <View style={styles.historyDateItem}>
              <Text style={styles.historyDateText}>Mon</Text>
              <View style={styles.historyDateNumber}>
                <Text style={styles.historyDateNumberText}>15</Text>
              </View>
            </View>
            <View style={styles.historyDateItem}>
              <Text style={styles.historyDateText}>Tue</Text>
              <View style={styles.historyDateNumber}>
                <Text style={styles.historyDateNumberText}>16</Text>
              </View>
            </View>
            <View style={styles.historyDateItem}>
              <Text style={styles.historyDateText}>Wed</Text>
              <View style={styles.historyDateNumber}>
                <Text style={styles.historyDateNumberText}>17</Text>
              </View>
            </View>
            <View style={styles.historyDateItem}>
              <Text style={styles.historyDateText}>Thu</Text>
              <View style={styles.historyDateNumber}>
                <Text style={styles.historyDateNumberText}>18</Text>
              </View>
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
});

export default Home;
