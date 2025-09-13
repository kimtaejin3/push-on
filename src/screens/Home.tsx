import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {StyleSheet, Text, View} from 'react-native';
import CustomButton from '../components/CustomButton';

function Home(): React.JSX.Element {
  const navigation = useNavigation();
  return (
    <SafeAreaView style={styles.safeArea}>
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
});

export default Home;
