import {useState} from 'react';
import {useEffect} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {encouragements, FIRST_ENCOURAGEMENT} from '../../../constants/push-up';

function Engagement({pushUpCount}: {pushUpCount: number}) {
  const [encouragement, setEncouragement] = useState(FIRST_ENCOURAGEMENT);

  useEffect(() => {
    if (pushUpCount === 0) {
      return;
    }
    setEncouragement(getRandomEncouragement());
  }, [pushUpCount]);

  return (
    <View>
      <Text style={styles.encouragementText}>{encouragement}</Text>
    </View>
  );
}

const getRandomEncouragement = () => {
  const randomIndex = Math.floor(Math.random() * encouragements.length);
  return encouragements[randomIndex];
};

const styles = StyleSheet.create({
  encouragementText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#3EB489',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
});

export default Engagement;
