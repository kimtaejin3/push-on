import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {StyleSheet, Text, View, ScrollView} from 'react-native';
import CustomButton from '../components/common/CustomButton';
import Fontawesome5 from '@react-native-vector-icons/fontawesome5';

function HomeScreen(): React.JSX.Element {
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
              name="home"
              size={18}
              iconStyle="solid"
              color="#242424"
            />
            <Text>PumpUp</Text>
          </View>
          <View style={styles.headerIcons}>
            <Fontawesome5
              name="cog"
              size={20}
              iconStyle="solid"
              color="#242424"
            />
            <Fontawesome5
              name="bell"
              size={20}
              iconStyle="solid"
              color="#242424"
            />
          </View>
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
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 25,
  },
});

export default HomeScreen;
