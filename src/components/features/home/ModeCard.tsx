import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import {colors} from '../../../constants/colors';

type SolidIconProps = Extract<React.ComponentProps<typeof FontAwesome6>, {iconStyle: 'solid'}>;
type IconName = SolidIconProps['name'];

interface ModeCardProps {
  icon: IconName;
  title: string;
  description: string;
  status?: string;
  onPress: () => void;
}

/** Material 느낌의 평평한 카드: 왼쪽 아이콘 타일 + 제목/설명 + (선택) 상태 텍스트 */
function ModeCard({icon, title, description, status, onPress}: ModeCardProps) {
  return (
    <Pressable
      onPress={onPress}
      android_ripple={{color: colors.overlayMedium}}
      style={({pressed}) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.iconTile}>
        <FontAwesome6 name={icon} size={20} color={colors.primary} iconStyle="solid" />
      </View>
      <View style={styles.texts}>
        <View style={styles.row}>
          <Text style={styles.title}>{title}</Text>
          {status ? <Text style={styles.status}>{status}</Text> : null}
        </View>
        <Text style={styles.description}>{description}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: colors.overlayLight,
    borderRadius: 16,
    padding: 18,
  },
  pressed: {
    backgroundColor: colors.overlayMedium,
  },
  iconTile: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.primaryOverlayMedium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texts: {
    flex: 1,
    gap: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.textLight,
  },
  status: {
    fontSize: 13,
    color: colors.primaryLight,
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.gray400,
  },
});

export default ModeCard;
