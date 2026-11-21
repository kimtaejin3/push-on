import React from 'react';
import {Modal, ScrollView, StatusBar, StyleSheet, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {color, layout, radius, space} from '../../../theme';
import {Button} from '../../ui/Button';
import {Icon} from '../../ui/Icon';
import {Text} from '../../ui/Text';

export function TrackingPrePrompt({
  visible,
  onContinue,
  onDismiss,
}: {
  visible: boolean;
  onContinue: () => void;
  onDismiss?: () => void;
}) {
  return (
    <Modal
      visible={visible}
      presentationStyle="fullScreen"
      onRequestClose={() => {}}
      onDismiss={onDismiss}>
      <StatusBar barStyle="light-content" backgroundColor={color.bg} />
      <SafeAreaView style={styles.screen}>
        <ScrollView bounces={false} contentContainerStyle={styles.content}>
          <View style={styles.icon}>
            <Icon name="shield-check" size={space[32]} color="active" />
          </View>
          <View accessibilityRole="header">
            <Text variant="title" style={styles.centered}>
              {'광고를 덜 귀찮게\n보여 드리려고 물어볼게요'}
            </Text>
          </View>
          <Text color="textMuted" style={styles.centered}>
            다음 창에서 허용하면 관심 있을 만한 광고가 나와요. 운동 기록은 광고에 쓰지 않아요. 허용하지 않아도 앱은 똑같이 써요.
          </Text>
        </ScrollView>
        <Button variant="primary" title="계속" onPress={onContinue} />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    width: '100%',
    alignSelf: 'center',
    backgroundColor: color.bg,
    paddingHorizontal: layout.screenPadding,
    paddingBottom: space[16],
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    alignSelf: 'center',
    alignItems: 'center',
    maxWidth: layout.frameWidth,
    gap: space[16],
    paddingVertical: space[24],
  },
  icon: {
    width: 2 * space[48],
    height: 2 * space[48],
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: color.activeSoft,
  },
  centered: {textAlign: 'center'},
});
