import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {useAuth} from '../hooks/useAuth';
import {colors} from '../constants/colors';
import Logo from '../assets/svgs/logo.svg';

function HomeScreen(): React.JSX.Element {
  const navigation = useNavigation();

  const {user} = useAuth();

  console.log('user', user);

  // 일주일간의 푸쉬업 데이터 (예시)

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.titleContainer}>
        <View style={styles.titleRow}>
          <Logo width={26} height={26} fill="#7D5FFF" />
          <Text style={styles.title}>PushOn</Text>
        </View>
      </View>
      <TouchableOpacity
        style={styles.startButton}
        onPress={() => navigation.navigate('Challenge')}>
        <Text style={styles.startButtonText}>Start</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    padding: 20,
    // backgroundColor: colors.backgroundLight,
    backgroundColor: '#0d0d0d',
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
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textLight,
  },
  startButton: {
    marginTop: 10,
    marginBottom: 30,
    // backgroundColor: '#ed3b64',
    borderWidth: 10,
    backgroundColor: '#0d0d0d',
    borderColor: '#7D5FFF',
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
});

export default HomeScreen;
