import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableOpacityProps,
} from 'react-native';
import {colors} from '../../constants/colors';

interface CustomButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'start' | 'stop' | 'default';
}

const CustomButton: React.FC<CustomButtonProps> = ({
  title,
  variant = 'default',
  style,
  ...rest
}) => {
  const buttonStyle = () => {
    switch (variant) {
      case 'start':
        return styles.startButton;
      case 'stop':
        return styles.stopButton;
      default:
        return styles.defaultButton;
    }
  };

  return (
    <TouchableOpacity style={[styles.button, buttonStyle(), style]} {...rest}>
      <Text style={styles.buttonText}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: 17,
    paddingHorizontal: 80,
    borderRadius: 20,
    width: '100%',
    fontSize: 14,
    textAlign: 'center',
  },
  defaultButton: {
    backgroundColor: colors.buttonDisabled,
  },
  startButton: {
    backgroundColor: colors.tabInactive,
  },
  stopButton: {
    backgroundColor: 'gray',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    width: '100%',
  },
});

export default CustomButton;
