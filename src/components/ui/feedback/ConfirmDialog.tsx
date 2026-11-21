import React, {useEffect, useRef} from 'react';
import {
  Animated,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {color, layout, radius, space} from '../../../theme';
import {Text} from '../Text';

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message?: string;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel,
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const insets = useSafeAreaInsets();
  const scale = useRef(new Animated.Value(0.96)).current;
  useEffect(() => {
    if (!visible) {
      return;
    }
    scale.setValue(0.96);
    const animation = Animated.timing(scale, {
      toValue: 1,
      duration: 160,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [scale, visible]);

  return (
    <Modal
      visible={visible}
      transparent
      statusBarTranslucent
      navigationBarTranslucent
      animationType="fade"
      onRequestClose={onCancel}>
      <View
        style={[
          styles.overlay,
          {
            paddingTop: insets.top + space[24],
            paddingBottom: insets.bottom + space[24],
            paddingLeft: insets.left + space[24],
            paddingRight: insets.right + space[24],
          },
        ]}>
        <Pressable
          accessible={false}
          style={styles.backdrop}
          onPress={destructive ? undefined : onCancel}
          disabled={destructive}
        />
        <Animated.View
          accessibilityViewIsModal
          onAccessibilityEscape={onCancel}
          style={[styles.dialog, {transform: [{scale}]}]}>
          <ScrollView bounces={false} contentContainerStyle={styles.content}>
            <View style={styles.copy}>
              <Text variant="headline" weight={800} style={styles.title}>
                {title}
              </Text>
              {message ? (
                <Text color="textMuted" style={styles.message}>
                  {message}
                </Text>
              ) : null}
            </View>
            <View style={styles.actions}>
              {cancelLabel ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={onCancel}
                  style={({pressed}) => [
                    styles.button,
                    styles.cancel,
                    pressed && styles.pressed,
                  ]}>
                  <Text weight={800} style={styles.buttonLabel}>
                    {cancelLabel}
                  </Text>
                </Pressable>
              ) : null}
              <Pressable
                accessibilityRole="button"
                onPress={onConfirm}
                style={({pressed}) => [
                  styles.button,
                  destructive ? styles.destructive : styles.confirm,
                  !cancelLabel && styles.singleAction,
                  pressed && styles.pressed,
                ]}>
                <Text
                  color={destructive ? 'onAccent' : 'onBrand'}
                  weight={800}
                  style={styles.buttonLabel}>
                  {confirmLabel}
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  backdrop: {...StyleSheet.absoluteFillObject, backgroundColor: '#000000B3'},
  dialog: {
    width: '100%',
    maxWidth: 329,
    flexShrink: 1,
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: radius.dialog,
  },
  content: {padding: space[24], gap: space[24]},
  copy: {gap: space[8]},
  title: {fontSize: 20, lineHeight: 28},
  message: {fontSize: 15, lineHeight: 21},
  actions: {flexDirection: 'row', gap: space[8]},
  button: {
    flex: 1,
    minHeight: 48,
    minWidth: layout.touchMin,
    borderRadius: radius.m,
    paddingHorizontal: space[12],
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancel: {
    backgroundColor: color.surface2,
    borderColor: color.border,
    borderWidth: 1,
  },
  confirm: {backgroundColor: color.activeButton},
  destructive: {backgroundColor: color.alert},
  singleAction: {minHeight: layout.primaryButtonHeight},
  pressed: {opacity: 0.7},
  buttonLabel: {textAlign: 'center'},
});
