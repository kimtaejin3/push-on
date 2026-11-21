import React from 'react';
import {
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import {color, radius, space} from '../../theme';
import {Text} from '../ui/Text';

interface UpdateModalProps {
  visible: boolean;
  releaseNotes: string | null;
  forceUpdate: boolean;
  version?: string;
  onUpdate: () => void;
  onDismiss?: () => void;
}

export function UpdateModal({
  visible,
  releaseNotes,
  forceUpdate,
  version,
  onUpdate,
  onDismiss,
}: UpdateModalProps) {
  const handleUpdate = () => {
    const packageName = 'com.pushupapp';
    const playStoreUrl = `market://details?id=${packageName}`;
    const webUrl = `https://play.google.com/store/apps/details?id=${packageName}`;

    Linking.openURL(playStoreUrl).catch(() => {
      Linking.openURL(webUrl);
    });

    // 스토어에서 업데이트하지 않고 돌아온 경우에도 필수 업데이트는 계속 표시한다
    if (!forceUpdate) {
      onUpdate();
    }
  };

  const title = forceUpdate
    ? '계속 쓰려면 업데이트가 필요해요'
    : ['새 버전이 나왔어요', version].filter(Boolean).join(' · ');
  const notes = forceUpdate
    ? '이 버전은 더 이상 지원하지 않아요. 업데이트해도 기록은 그대로 이어져요.'
    : releaseNotes;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => {
        if (!forceUpdate) {
          onDismiss?.();
        }
      }}>
      <View style={styles.overlay}>
        <View style={styles.dialog} accessibilityViewIsModal>
          <Text weight={800} style={styles.title}>
            {title}
          </Text>
          {notes ? (
            <ScrollView style={styles.notes}>
              <Text color="textMuted" style={styles.body}>
                {notes}
              </Text>
            </ScrollView>
          ) : null}
          <View style={styles.actions}>
            {!forceUpdate && onDismiss ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="나중에"
                onPress={onDismiss}
                style={({pressed}) => [
                  styles.button,
                  styles.secondary,
                  pressed && styles.pressed,
                ]}>
                <Text weight={800} style={styles.buttonLabel}>
                  나중에
                </Text>
              </Pressable>
            ) : null}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="업데이트하기"
              onPress={handleUpdate}
              style={({pressed}) => [
                styles.button,
                styles.primary,
                pressed && styles.pressed,
              ]}>
              <Text color="onBrand" weight={800} style={styles.buttonLabel}>
                업데이트하기
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: '#000000B3',
    justifyContent: 'center',
    alignItems: 'center',
    padding: space[24],
  },
  dialog: {
    width: '100%',
    maxWidth: 329,
    maxHeight: '100%',
    backgroundColor: color.surface,
    borderColor: color.border,
    borderWidth: 1,
    borderRadius: radius.dialog,
    padding: space[24],
  },
  title: {fontSize: 20, lineHeight: 28},
  notes: {flexGrow: 0, flexShrink: 1, marginTop: space[8]},
  body: {fontSize: 15, lineHeight: 21},
  actions: {flexDirection: 'row', gap: space[8], marginTop: space[24]},
  button: {
    flex: 1,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.m,
    paddingHorizontal: space[12],
  },
  buttonLabel: {textAlign: 'center'},
  primary: {backgroundColor: color.activeButton},
  secondary: {
    backgroundColor: color.surface2,
    borderWidth: 1,
    borderColor: color.border,
  },
  pressed: {opacity: 0.7},
});
