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
              color="#000"
            />
          </View>
          <Fontawesome5 name="bell" size={24} iconStyle="solid" color="black" />
        </View>

        <View style={styles.challengeContainer}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>최고 기록</Text>
            <Text style={styles.cardText}>
              총 횟수: 40번 / 총 수행시간: 1분 40초
            </Text>
            <CustomButton
              title="푸쉬업 하기"
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
});

export default Home;
