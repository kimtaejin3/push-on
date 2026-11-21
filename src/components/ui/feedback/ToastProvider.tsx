import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  AccessibilityInfo,
  Animated,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {color, layout, radius, space} from '../../../theme';
import {Icon} from '../Icon';
import {Text} from '../Text';

interface ToastOptions {
  action?: {label: string; onPress: () => void};
  tone?: 'neutral' | 'alert';
}

interface ToastContextValue {
  show: (message: string, options?: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const toast = useContext(ToastContext);
  if (!toast) {
    throw new Error('useToast는 ToastProvider 안에서 사용해야 해요.');
  }
  return toast;
}

export function ToastProvider({children}: {children: ReactNode}) {
  const [toast, setToast] = useState<({message: string} & ToastOptions) | null>(
    null,
  );
  const insets = useSafeAreaInsets();
  const opacity = useRef(new Animated.Value(0)).current;
  const [api] = useState<ToastContextValue>(() => ({
    show: (message, options) => setToast({message, ...options}),
  }));

  useEffect(() => {
    if (!toast) {
      return;
    }

    opacity.setValue(0);
    const animation = Animated.timing(opacity, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true,
    });
    animation.start();
    AccessibilityInfo.announceForAccessibility(toast.message);
    const timer = setTimeout(() => {
      setToast(current => (current === toast ? null : current));
    }, 2500);
    return () => {
      animation.stop();
      clearTimeout(timer);
    };
  }, [opacity, toast]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      {toast ? (
        <View
          pointerEvents="box-none"
          style={[
            styles.overlay,
            {
              bottom: insets.bottom + 86,
              left: insets.left + layout.screenPadding,
              right: insets.right + layout.screenPadding,
            },
          ]}>
          <Animated.View style={[styles.toast, {opacity}]}>
            <Icon
              name={toast.tone === 'alert' ? 'info' : 'circle-check'}
              color={toast.tone === 'alert' ? 'alert' : 'active'}
            />
            <Text variant="label" weight={700} style={styles.message}>
              {toast.message}
            </Text>
            {toast.action ? (
              <Pressable
                accessibilityRole="button"
                style={styles.action}
                onPress={() => {
                  setToast(null);
                  toast.action?.onPress();
                }}>
                <Text variant="label" weight={700} color="active">
                  {toast.action.label}
                </Text>
              </Pressable>
            ) : null}
          </Animated.View>
        </View>
      ) : null}
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    alignItems: 'center',
    zIndex: 1,
  },
  toast: {
    width: '100%',
    maxWidth: layout.frameWidth - 2 * layout.screenPadding,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: color.surface2,
    borderRadius: radius.m,
    borderColor: color.border,
    borderWidth: 1,
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: space[16],
  },
  message: {flex: 1, fontSize: 15, lineHeight: 21},
  action: {
    minWidth: layout.touchMin,
    minHeight: layout.touchMin,
    maxWidth: '40%',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
