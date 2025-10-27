import FontAwesome5 from '@react-native-vector-icons/fontawesome5';
import {StyleSheet, View} from 'react-native';
import {colors} from '../../../constants/colors';
import Timer from '../../common/Timer';

interface TimerContainerProps {
  formattedTime: string;
}
function TimerContainer({
  formattedTime,
}: TimerContainerProps): React.JSX.Element {
  return (
    <View style={styles.timeContainer}>
      <FontAwesome5
        name="clock"
        iconStyle="solid"
        size={17}
        color={colors.gray400}
      />
      <Timer time={formattedTime} style={styles.timeText} />
    </View>
  );
}

const styles = StyleSheet.create({
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 40,
    marginBottom: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: colors.gray900,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  timeText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textLight,
    textShadowColor: colors.gray900,
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 2,
  },
});

export default TimerContainer;
