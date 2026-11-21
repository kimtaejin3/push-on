import React, {useEffect} from 'react';
import {ActivityIndicator, BackHandler, StyleSheet, View} from 'react-native';
import {color, layout, radius, space} from '../../../theme';
import {Text} from '../../ui/Text';

export function SavingOverlay({
  reps,
  detail,
  queued,
}: {
  reps: number;
  detail?: string;
  queued?: boolean;
}) {
  useEffect(() => {
    const back = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => back.remove();
  }, []);

  return (
    <View pointerEvents="auto" accessibilityViewIsModal style={styles.overlay}>
      <View style={styles.spinner}>
        <ActivityIndicator size="large" color={color.active} />
      </View>
      <View accessibilityRole="header" accessibilityLiveRegion="polite">
        <Text variant="title" style={styles.centered}>
          {queued ? '오늘 기록 저장 대기' : '오늘 기록 저장 중'}
        </Text>
      </View>
      <Text color="textMuted" style={styles.centered}>
        {`${reps}개${detail ? ` · ${detail}` : ''}`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: color.bg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: layout.screenPadding,
    gap: space[12],
    zIndex: 2,
  },
  spinner: {
    width: 2 * space[32],
    height: 2 * space[32],
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    borderWidth: space[4],
    borderColor: color.activeLine,
  },
  centered: {textAlign: 'center'},
});
