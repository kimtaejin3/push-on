import React, {type ReactNode} from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import {layout, space} from '../../theme';
import {Icon} from './Icon';
import {Text} from './Text';

interface ScreenHeaderProps {
  title: string;
  onBack?: () => void;
  right?: ReactNode;
}

export function ScreenHeader({title, onBack, right}: ScreenHeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.side}>
        {onBack && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="뒤로"
            onPress={onBack}
            style={({pressed}) => [styles.back, pressed && styles.pressed]}>
            <Icon name="chevron-left" size={24} />
          </Pressable>
        )}
      </View>
      <View accessibilityRole="header" style={styles.titleContainer}>
        <Text weight={800} style={styles.title}>
          {title}
        </Text>
      </View>
      <View style={[styles.side, styles.right]}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space[8],
  },
  side: {flex: 1, minWidth: layout.touchMin, alignItems: 'flex-start'},
  right: {alignItems: 'flex-end'},
  back: {
    width: layout.touchMin,
    height: layout.touchMin,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {flexShrink: 1},
  title: {fontSize: 17, textAlign: 'center'},
  pressed: {opacity: 0.7},
});
