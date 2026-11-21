import React from 'react';
import {Pressable, StyleSheet, Text} from 'react-native';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import {colors} from '../../../constants/colors';

interface StreakBadgeProps {
  current: number;
  todayDone: boolean;
  onPress: () => void;
}

/** 홈 제목 줄 오른쪽의 불꽃 + 숫자. 오늘 했으면 켜진 색, 아직이면 흐린 색 */
function StreakBadge({current, todayDone, onPress}: StreakBadgeProps) {
  const color = todayDone ? colors.primary : colors.gray700;
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={`${current}일 연속, ${todayDone ? '오늘 완료' : '오늘 아직'}. 스트릭 보기`}
      style={({pressed}) => [styles.badge, pressed && styles.pressed]}>
      <FontAwesome6 name="fire" size={18} color={color} iconStyle="solid" />
      <Text style={[styles.count, !todayDone && styles.countDim]}>{current}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.overlayLight,
  },
  pressed: {backgroundColor: colors.overlayMedium},
  count: {fontSize: 16, fontWeight: 'bold', color: colors.textLight},
  countDim: {color: colors.gray400},
});

export default StreakBadge;
