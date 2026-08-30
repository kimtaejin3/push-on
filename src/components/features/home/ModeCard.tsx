import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {colors} from '../../../constants/colors';

interface ModeCardProps {
  title: string;
  description: string;
  status?: string;
  onPress: () => void;
}

/** 텍스트만 있는 평평한 카드. 아이콘/장식 없음 (Material 느낌). */
function ModeCard({title, description, status, onPress}: ModeCardProps) {
  return (
    <Pressable
      onPress={onPress}
      android_ripple={{color: colors.overlayMedium}}
      style={({pressed}) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.row}>
        <Text style={styles.title}>{title}</Text>
        {status ? <Text style={styles.status}>{status}</Text> : null}
      </View>
      <Text style={styles.description}>{description}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.overlayLight,
    borderRadius: 16,
    padding: 20,
    gap: 6,
  },
  pressed: {
    backgroundColor: colors.overlayMedium,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textLight,
  },
  status: {
    fontSize: 13,
    color: colors.primaryLight,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.gray400,
  },
});

export default ModeCard;
