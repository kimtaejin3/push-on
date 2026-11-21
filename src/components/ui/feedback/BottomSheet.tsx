import React, {useEffect, useRef, type ReactNode} from 'react';
import {
  Animated,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {color, radius, space} from '../../../theme';
import {Text} from '../Text';

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

export function BottomSheet({
  visible,
  onClose,
  title,
  children,
}: BottomSheetProps) {
  const insets = useSafeAreaInsets();
  const offset = useRef(new Animated.Value(24)).current;
  useEffect(() => {
    if (!visible) {
      return;
    }
    offset.setValue(24);
    const animation = Animated.timing(offset, {
      toValue: 0,
      duration: 180,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [offset, visible]);

  return (
    <Modal
      visible={visible}
      transparent
      statusBarTranslucent
      navigationBarTranslucent
      animationType="fade"
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable
          accessible={false}
          style={styles.backdrop}
          onPress={onClose}
        />
        <Animated.View
          accessibilityViewIsModal
          onAccessibilityEscape={onClose}
          style={[styles.sheet, {transform: [{translateY: offset}]}]}>
          <View style={styles.handle} />
          <ScrollView
            bounces={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={[
              styles.content,
              {
                paddingBottom: Math.max(34, insets.bottom),
                paddingLeft: space[24] + insets.left,
                paddingRight: space[24] + insets.right,
              },
            ]}>
            {title ? (
              <Text variant="headline" weight={800} style={styles.title}>
                {title}
              </Text>
            ) : null}
            {children}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {flex: 1, justifyContent: 'flex-end'},
  backdrop: {...StyleSheet.absoluteFillObject, backgroundColor: '#000000B3'},
  sheet: {
    maxHeight: '90%',
    backgroundColor: color.surface,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    paddingTop: 10,
    gap: space[20],
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: color.border,
  },
  content: {gap: space[8]},
  title: {lineHeight: 31, marginBottom: space[4]},
});
