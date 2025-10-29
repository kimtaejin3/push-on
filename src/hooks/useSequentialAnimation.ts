import {useEffect, useRef} from 'react';
import {Animated} from 'react-native';

interface UseSequentialAnimationOptions {
  durations?: number[];
  delays?: number[];
  useNativeDriver?: boolean;
}

export const useSequentialAnimation = (
  elementCount: number,
  options: UseSequentialAnimationOptions = {},
) => {
  const {
    durations = [400, 300, 250, 100],
    delays = [],
    useNativeDriver = true,
  } = options;

  // 애니메이션 값들을 동적으로 생성
  const animations = useRef(
    Array.from({length: elementCount}, () => new Animated.Value(0)),
  ).current;

  useEffect(() => {
    const animationSequence = animations.map((anim, index) =>
      Animated.timing(anim, {
        toValue: 1,
        duration: durations[index] || durations[durations.length - 1],
        delay: delays[index] || 0,
        useNativeDriver,
      }),
    );

    Animated.sequence(animationSequence).start();
  }, [animations, durations, delays, useNativeDriver]);

  return animations;
};

// 애니메이션 스타일 헬퍼 함수들
export const createFadeInStyle = (
  animValue: Animated.Value,
  translateY: number = 20,
) => ({
  opacity: animValue,
  transform: [
    {
      translateY: animValue.interpolate({
        inputRange: [0, 1],
        outputRange: [translateY, 0],
      }),
    },
  ],
});

export const createSlideUpStyle = (
  animValue: Animated.Value,
  translateY: number = 15,
) => ({
  opacity: animValue,
  transform: [
    {
      translateY: animValue.interpolate({
        inputRange: [0, 1],
        outputRange: [translateY, 0],
      }),
    },
  ],
});

export const createSlideDownStyle = (
  animValue: Animated.Value,
  translateY: number = 10,
) => ({
  opacity: animValue,
  transform: [
    {
      translateY: animValue.interpolate({
        inputRange: [0, 1],
        outputRange: [translateY, 0],
      }),
    },
  ],
});

/**
 * 스케일과 회전 효과를 포함한 아이콘 애니메이션 스타일 생성
 * @param animValue 애니메이션 값
 * @returns scale과 rotate를 포함한 transform 스타일
 */
export const createScaleRotateStyle = (animValue: Animated.Value) => ({
  opacity: animValue,
  transform: [
    {
      scale: animValue.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [0, 1.2, 1],
      }),
    },
    {
      rotate: animValue.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
      }),
    },
  ],
});
