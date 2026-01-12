import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
} from 'react-native';
import {colors} from '../constants/colors';
import Logo from '../assets/svgs/logo.svg';
import FontAwesome5 from '@react-native-vector-icons/fontawesome5';
import {pushUpSetsByDateQueryOptions} from '../tanstack-query';
import {useQuery} from '@tanstack/react-query';
import {CURRENT_DATE, CURRENT_MONTH, CURRENT_YEAR} from '../atoms/date';

function HomeScreen(): React.JSX.Element {
  const navigation = useNavigation();

  useQuery(
    pushUpSetsByDateQueryOptions(CURRENT_YEAR, CURRENT_MONTH, CURRENT_DATE),
  );

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
          <View style={styles.startButtonGradientBorder}>
            <View style={styles.startButtonGradientBorderInner}>
              <View style={styles.startButtonInner}>
                <Text style={styles.startButtonText}>Start</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>

        <View style={styles.leaderboardContainer}>
          <View style={styles.leaderboardInner}>
            <View style={styles.leaderboardHeader}>
              <FontAwesome5
                name="trophy"
                size={18}
                color={colors.primary}
                iconStyle="solid"
              />
              <Text style={styles.leaderboardTitle}>내 순위 보기</Text>
            </View>

            <View style={styles.leaderboardContent}>
              <Text style={styles.leaderboardDescription}>
                다른 사용자들과 경쟁하며{'\n'}몇 등인지 확인해보세요!
              </Text>
              <TouchableOpacity
                style={styles.leaderboardButton}
                onPress={() => navigation.navigate('Leaderboard' as never)}>
                <Text style={styles.leaderboardButtonText}>순위 확인하기</Text>
                <FontAwesome5
                  name="chevron-right"
                  size={16}
                  color={colors.primary}
                  iconStyle="solid"
                />
              </TouchableOpacity>
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
    alignSelf: 'center',
  },
  startButtonGradientBorder: {
    height: 260,
    width: 260,
    borderRadius: 130,
    padding: 10,
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,
  },
  startButtonGradientBorderInner: {
    flex: 1,
    borderRadius: 120,
    backgroundColor: colors.backgroundDark,
    padding: 1,
  },
  startButtonInner: {
    flex: 1,
    borderRadius: 119,
    backgroundColor: colors.backgroundDark,
    justifyContent: 'center',
    alignItems: 'center',
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
  },
  gradientBorder: {
    borderRadius: 16,
    padding: 2,
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  gradientBorderInner: {
    borderRadius: 14,
    backgroundColor: colors.backgroundDark,
    padding: 1,
  },
  leaderboardInner: {
    backgroundColor: colors.overlayLight,
    borderRadius: 13,
    padding: 20,
  },
  leaderboardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  leaderboardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textLight,
  },
  leaderboardContent: {
    alignItems: 'center',
    gap: 16,
  },
  leaderboardDescription: {
    fontSize: 14,
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
