import React from 'react';
import {StyleSheet, View} from 'react-native';
import {color} from '../../theme';
import {Text} from '../ui/Text';

/** 모든 광고 자리 좌상단에 붙이는 '광고' 표시. 디자인 정책상 15px 아래로 줄이지 않는다 */
export function AdBadge() {
  return (
    <View style={styles.badge}>
      <Text color="adBadgeText" weight={700} style={styles.label}>
        광고
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: color.adBadgeBg,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  label: {fontSize: 15, lineHeight: 18},
});
