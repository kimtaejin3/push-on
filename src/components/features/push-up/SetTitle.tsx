import {useQuery} from '@tanstack/react-query';
import {pushUpSetsByDateQueryOptions} from '../../../tanstack-query';
import {StyleSheet, Text, View} from 'react-native';
import {colors} from '../../../constants/colors';

function SetTitle(): React.JSX.Element {
  const today = new Date();
  const {year, month, day} = {
    year: today.getFullYear(),
    month: today.getMonth() + 1,
    day: today.getDate(),
  };

  const {data: pushupSets, isLoading} = useQuery(
    pushUpSetsByDateQueryOptions(year, month, day),
  );

  if (isLoading || !pushupSets) {
    return (
      <View>
        <Text>SET -</Text>
      </View>
    );
  }

  return <Text style={styles.title}>SET {pushupSets.length + 1}</Text>;
}

const styles = StyleSheet.create({
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 40,
    color: colors.textSecondary,
  },
});

export default SetTitle;
