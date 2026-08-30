import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import {colors} from '../../../constants/colors';

type SolidIconProps = Extract<React.ComponentProps<typeof FontAwesome6>, {iconStyle: 'solid'}>;

interface LinkRowProps {
  icon: SolidIconProps['name'];
  title: string;
  onPress: () => void;
}

/** 모드 카드와 구별되는 한 줄짜리 이동 링크 (Material list item 느낌: 배경 없음, 오른쪽 chevron) */
function LinkRow({icon, title, onPress}: LinkRowProps) {
  return (
    <Pressable
      onPress={onPress}
      android_ripple={{color: colors.overlayMedium}}
      style={({pressed}) => [styles.row, pressed && styles.pressed]}>
      <View style={styles.left}>
        <FontAwesome6 name={icon} size={16} color={colors.gray400} iconStyle="solid" />
        <Text style={styles.title}>{title}</Text>
      </View>
      <FontAwesome6 name="chevron-right" size={14} color={colors.gray400} iconStyle="solid" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderRadius: 8,
  },
  pressed: {
    backgroundColor: colors.overlayLight,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 15,
    color: colors.textLight,
  },
});

export default LinkRow;
