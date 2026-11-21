import {StyleSheet} from 'react-native';
import {color, radius, space} from '../../../theme';

export const cardStyles = StyleSheet.create({
  sets: {fontSize: 26, lineHeight: 32},
  callout: {
    backgroundColor: color.surface2,
    borderRadius: radius.m,
    padding: space[12],
    gap: space[4],
  },
});
