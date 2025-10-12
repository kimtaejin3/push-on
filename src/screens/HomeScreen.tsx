import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
} from 'react-native';
import {useAuth} from '../hooks/useAuth';
import {colors} from '../constants/colors';
import Logo from '../assets/svgs/logo.svg';
import FontAwesome5 from '@react-native-vector-icons/fontawesome5';

function HomeScreen(): React.JSX.Element {
  const navigation = useNavigation();

  const {user} = useAuth();

  console.log('user', user);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}>
        <View style={styles.titleContainer}>
          <View style={styles.titleRow}>
            <Logo width={26} height={26} fill={colors.primary} />
            <Text style={styles.title}>PushOn</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.startButton}
          onPress={() => navigation.navigate('Challenge')}>
          <Text style={styles.startButtonText}>Start</Text>
        </TouchableOpacity>

        {/* 오늘의 순위 섹션 */}
        <TouchableOpacity
          style={styles.leaderboardContainer}
          onPress={() => navigation.navigate('Tabs' as never)}>
          <View style={styles.leaderboardHeader}>
            <FontAwesome5
              name="trophy"
              size={20}
              color={colors.primary}
              iconStyle="solid"
            />
            <Text style={styles.leaderboardTitle}>오늘의 순위</Text>
          </View>

          <View style={styles.leaderboardContent}>
            <Text style={styles.leaderboardDescription}>
              다른 사용자들과 경쟁하며{'\n'}오늘의 순위를 확인해보세요!
            </Text>
            <View style={styles.leaderboardButton}>
              <Text style={styles.leaderboardButtonText}>순위 확인하기</Text>
              <FontAwesome5
                name="chevron-right"
                size={16}
                color={colors.primary}
                iconStyle="solid"
              />
            </View>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    padding: 20,
    // backgroundColor: colors.backgroundLight,
    backgroundColor: colors.backgroundDark,
  },
  scrollView: {
    flex: 1,
  },
  titleContainer: {
    marginBottom: 40,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textLight,
  },
  startButton: {
    marginTop: 20,
    marginBottom: 30,
    borderWidth: 10,
    borderColor: colors.primary,
    borderRadius: 9999,
    paddingVertical: 15,
    height: 260,
    width: 260,
    alignSelf: 'center',
    justifyContent: 'center',
  },
  startButtonText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: colors.textLight,
    textAlign: 'center',
  },
  // 리더보드 스타일
  leaderboardContainer: {
    marginTop: 30,
    backgroundColor: colors.overlayLight,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  leaderboardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  leaderboardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textLight,
  },
  leaderboardContent: {
    alignItems: 'center',
    gap: 16,
  },
  leaderboardDescription: {
    fontSize: 16,
    color: colors.textLight,
    textAlign: 'center',
    lineHeight: 24,
    opacity: 0.8,
  },
  leaderboardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primaryOverlay,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: colors.primaryBorderMedium,
  },
  leaderboardButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
});

export default HomeScreen;
