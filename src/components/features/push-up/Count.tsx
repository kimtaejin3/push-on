import React, {useEffect, useRef} from 'react';
import {Animated, StyleSheet, useWindowDimensions} from 'react-native';
import {layout} from '../../../theme';
import {Text} from '../../ui/Text';

interface CountProps {
  value: number;
  color?: 'text' | 'onBrand' | 'onAccent';
  pulse?: boolean;
}

function Count({value, color = 'text', pulse = false}: CountProps) {
  const {width} = useWindowDimensions();
  const scale = useRef(new Animated.Value(1)).current;
  const previous = useRef(value);
  // 가장 넓은 숫자 글리프(Big Shoulders Black)는 글자 크기의 51.5%다.
  const fontSize = Math.min(
    330,
    (width - layout.screenPadding * 2) / (String(value).length * 0.515),
  );

  useEffect(() => {
    const increased = value > previous.current;
    previous.current = value;
    if (!pulse || !increased) {
      scale.setValue(1);
      return;
    }
    scale.setValue(1.035);
    const animation = Animated.timing(scale, {
      toValue: 1,
      duration: 180,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [value, pulse, scale]);

  return (
    <Animated.View style={{transform: [{scale}]}}>
      <Text
        variant="display"
        color={color}
        style={[
          styles.count,
          {fontSize, lineHeight: Math.round((fontSize * 290) / 330)},
        ]}>
        {value}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  count: {textAlign: 'center'},
});

export default Count;
