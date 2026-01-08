import React from 'react';
import {Text as RNText, TextProps as RNTextProps, StyleSheet} from 'react-native';
import {colors} from '../../constants/colors';

interface TextProps extends RNTextProps {
  color?: keyof typeof colors;
}

const Text: React.FC<TextProps> = ({style, color = 'textLight', ...rest}) => {
  return (
    <RNText
      style={[styles.defaultText, {color: colors[color]}, style]}
      {...rest}
    />
  );
};

const styles = StyleSheet.create({
  defaultText: {
    color: colors.textLight,
  },
});

export default Text;

