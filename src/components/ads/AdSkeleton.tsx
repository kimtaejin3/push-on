import React, {useEffect, useRef} from 'react';
import {
  AccessibilityInfo,
  Animated,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import {color, radius, space} from '../../theme';
import {AdBadge} from './AdBadge';

// 네이티브 카드가 로드되기 전 미리 잡아 두는 높이 (디자인 Ad/Skeleton, 폭 353 기준 카드 높이와 같다)
export const NATIVE_AD_SKELETON_HEIGHT = 358;

const PULSE_DURATION_MS = 700;
const PULSE_MIN_OPACITY = 0.45;

/** 자리 표시 덩어리를 천천히 깜빡인다. 동작 줄이기를 켠 사용자에게는 멈춰 둔다 */
function usePulse() {
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: PULSE_MIN_OPACITY,
          duration: PULSE_DURATION_MS,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: PULSE_DURATION_MS,
          useNativeDriver: true,
        }),
      ]),
    );
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled()
      .then(reduced => {
        if (!cancelled && !reduced) {
          loop.start();
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
      loop.stop();
    };
  }, [opacity]);

  return opacity;
}

/** 네이티브 카드(Ad/Native Medium) 자리를 같은 높이로 잡아 두는 스켈레톤 */
export function AdSkeleton({style}: {style?: StyleProp<ViewStyle>}) {
  const opacity = usePulse();

  return (
    <View style={[styles.card, style]}>
      <AdBadge />
      <Animated.View style={[styles.body, {opacity}]}>
        <View style={styles.head}>
          <View style={styles.icon} />
          <View style={styles.lines}>
            <View style={styles.line1} />
            <View style={styles.line2} />
          </View>
        </View>
        <View style={styles.media} />
        <View style={styles.cta} />
      </Animated.View>
    </View>
  );
}

/** 인라인 배너 자리 안을 채우는 스켈레톤 (컨테이너는 InlineAdBanner 가 그린다) */
export function BannerSkeleton({style}: {style?: StyleProp<ViewStyle>}) {
  const opacity = usePulse();

  return (
    <Animated.View style={[styles.bannerRow, style, {opacity}]}>
      <View style={styles.icon} />
      <View style={styles.lines}>
        <View style={styles.line1} />
        <View style={styles.line2} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    height: NATIVE_AD_SKELETON_HEIGHT,
    backgroundColor: color.adSurface,
    borderWidth: 1,
    borderColor: color.adBorder,
    borderRadius: radius.m,
    padding: 14,
    gap: space[12],
  },
  body: {flex: 1, gap: space[12]},
  head: {flexDirection: 'row', alignItems: 'center', gap: space[12]},
  icon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: color.adMedia,
  },
  lines: {flex: 1, gap: space[8]},
  line1: {
    width: 140,
    height: 12,
    borderRadius: 4,
    backgroundColor: color.adMedia,
  },
  line2: {height: 10, borderRadius: 4, backgroundColor: color.adMedia},
  media: {flex: 1, borderRadius: radius.s, backgroundColor: color.adMedia},
  cta: {height: 44, borderRadius: radius.s, backgroundColor: color.adMedia},
  bannerRow: {flexDirection: 'row', alignItems: 'center', gap: space[12]},
});
