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
import {
  Header,
  HeaderTitle,
  Notification,
  Setting,
} from '../components/common/Header';
import {useAuth} from '../hooks/useAuth';
import {colors} from '../constants/colors';

function HomeScreen(): React.JSX.Element {
  const navigation = useNavigation();

  const {user} = useAuth();

  console.log('user', user);

  // 일주일간의 푸쉬업 데이터 (예시)

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        left={
          <HeaderTitle
            title="PushFit"
            icon={
              <Fontawesome5
                name="home"
                size={18}
                iconStyle="solid"
                color={colors.primary}
              />
            }
          />
        }
        right={
          <>
            <Notification />
            <Setting />
          </>
        }
      />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}>
        {/* 최고 기록 카드 */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>최고 기록</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <View style={styles.statIconContainer}>
                <Fontawesome5
                  name="fire"
                  size={20}
                  iconStyle="solid"
                  color="#fff"
                />
              </View>
              <Text style={styles.statLabel}>최대 횟수</Text>
              <Text style={styles.statValue}>40회</Text>
            </View>

            <View style={styles.statItem}>
              <View style={styles.statIconContainer}>
                <Fontawesome5
                  name="clock"
                  size={20}
                  iconStyle="solid"
                  color="#fff"
                />
              </View>
              <Text style={styles.statLabel}>최고 시간</Text>
              <Text style={styles.statValue}>1분 40초</Text>
            </View>

            <View style={styles.statItem}>
              <View style={styles.statIconContainer}>
                <Fontawesome5
                  name="bolt"
                  size={20}
                  iconStyle="solid"
                  color="#fff"
                />
              </View>
              <Text style={styles.statLabel}>최고 속도</Text>
              <Text style={styles.statValue}>30회/분</Text>
            </View>
          </View>
        </View>

        {/* 순위 정보 */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>순위 정보</Text>

          <TouchableOpacity style={styles.rankingItem}>
            <View style={styles.rankingLeft}>
              <View>
                <Text style={styles.rankTitle}>오늘의 순위</Text>
                <Text style={styles.rankDesc}>상위 10% 달성!</Text>
              </View>
            </View>
            <Fontawesome5
              name="chevron-right"
              iconStyle="solid"
              size={16}
              color="#ccc"
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.rankingItem}>
            <View style={styles.rankingLeft}>
              <View>
                <Text style={styles.rankTitle}>전체 순위</Text>
                <Text style={styles.rankDesc}>상위 100명 안에 들었어요!</Text>
              </View>
            </View>
            <Fontawesome5
              name="chevron-right"
              iconStyle="solid"
              size={16}
              color="#ccc"
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.rankingItem}>
            <View style={styles.rankingLeft}>
              <View>
                <Text style={styles.rankTitle}>속도 순위</Text>
                <Text style={styles.rankDesc}>상위 20%의 속도를 가졌어요!</Text>
              </View>
            </View>
            <Fontawesome5
              name="chevron-right"
              iconStyle="solid"
              size={16}
              color="#ccc"
            />
          </TouchableOpacity>
        </View>

        <CustomButton
          title="푸쉬업 하기"
          style={styles.startButton}
          onPress={() => navigation.navigate('Challenge')}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    padding: 20,
    backgroundColor: colors.backgroundLight,
  },
  scrollView: {
    flex: 1,
  },
  card: {
    padding: 20,
    borderRadius: 15,
    backgroundColor: colors.background,
    marginBottom: 20,
    shadowColor: colors.shadow,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: colors.textPrimary,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  statItem: {
    alignItems: 'center',
    width: '30%',
  },
  statIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.pastelBlue,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  rankingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  rankingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rankBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.lightBlue,
    marginRight: 15,
  },
  rankNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textLight,
  },
  rankTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  rankDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  startButton: {
    marginTop: 10,
    marginBottom: 30,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 15,
  },
});

export default HomeScreen;
