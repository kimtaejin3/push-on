import React from 'react';
import {StyleSheet, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useOnline} from '../../../hooks/useOnline';
import {color, space} from '../../../theme';
import {Icon} from '../Icon';
import {Text} from '../Text';

export function OfflineBar(): React.JSX.Element | null {
  const online = useOnline();
  if (online !== false) {
    return null;
  }

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
      <View
        accessibilityRole="alert"
        accessibilityLiveRegion="polite"
        style={styles.bar}>
        <Icon name="wifi-off" size={16} color="record" />
        <Text
          variant="caption"
          color="record"
          weight={700}
          style={styles.label}>
          오프라인이에요. 운동은 세고, 연결되면 저장해요
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {backgroundColor: color.bg},
  bar: {
    backgroundColor: color.offlineBar,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[8],
    paddingVertical: 9,
    paddingHorizontal: space[16],
  },
  label: {flex: 1},
});
