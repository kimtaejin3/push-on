import React from 'react';
import {Text, StyleSheet} from 'react-native';
import {colors} from '../../constants/colors';

interface TimerProps {
  time: string;
  style?: any;
}

const Timer: React.FC<TimerProps> = ({time, style}) => {
  return <Text style={[styles.timeText, style]}>{time}</Text>;
};

const styles = StyleSheet.create({
  timeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
    textAlign: 'center',
    marginVertical: 10,
  },
});

export default Timer;
