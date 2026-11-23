import React, {useEffect, useRef} from 'react';
import {AccessibilityInfo, Animated, Easing, StyleSheet, View} from 'react-native';
import {color, radius} from '../../../theme';

interface IndeterminateBarProps {
  width: number;
}

// 막대가 트랙을 한 번 지나가는 시간
const SWEEP_MS = 1100;
// 움직이는 막대 길이 (트랙 대비)
const INDICATOR_RATIO = 0.4;

/**
 * 진행률을 모를 때 쓰는 로딩 막대. 짧은 막대가 트랙 왼쪽 밖에서 오른쪽 밖으로 계속 지나간다.
 * 동작 줄이기를 켠 기기에서는 가운데에 멈춰 둔다.
 */
export function IndeterminateBar({width}: IndeterminateBarProps) {
  const indicatorWidth = Math.round(width * INDICATOR_RATIO);
  const progress = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    let loop: Animated.CompositeAnimation | null = null;
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled()
      .catch(() => false)
      .then(reduce => {
        if (cancelled || reduce) {
          return;
        }
        progress.setValue(0);
        loop = Animated.loop(
          Animated.timing(progress, {
            toValue: 1,
            duration: SWEEP_MS,
            easing: Easing.inOut(Easing.cubic),
            useNativeDriver: true,
          }),
        );
        loop.start();
      });
    return () => {
      cancelled = true;
      loop?.stop();
    };
  }, [progress]);

  const translateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [-indicatorWidth, width],
  });

  return (
    <View style={[styles.track, {width}]}>
      <Animated.View
        style={[
          styles.indicator,
          {width: indicatorWidth, transform: [{translateX}]},
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: color.surface2,
    overflow: 'hidden',
  },
  indicator: {
    height: '100%',
    borderRadius: radius.pill,
    backgroundColor: color.active,
  },
});
