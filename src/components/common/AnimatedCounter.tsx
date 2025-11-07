import React, {useEffect, useRef} from 'react';
import {Animated, StyleSheet, Text, ViewStyle} from 'react-native';

interface AnimatedCounterProps {
  count: number;
  isActive: boolean;
  style?: ViewStyle;
  activeStyle?: ViewStyle;
}

function AnimatedCounter({
  count,
  isActive,
  style,
  activeStyle,
}: AnimatedCounterProps): React.JSX.Element {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(scaleAnim, {
      toValue: isActive ? 0.85 : 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [isActive, scaleAnim]);

  return (
    <Animated.View
      style={[
        style,
        isActive && activeStyle,
        {
          transform: [{scale: scaleAnim}],
        },
      ]}>
      <Text style={styles.countText}>{count}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  countText: {
    fontSize: 70,
    fontWeight: '400',
    color: '#F0F0F0',
  },
});

export default AnimatedCounter;
