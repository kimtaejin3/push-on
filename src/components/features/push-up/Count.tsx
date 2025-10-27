import {Animated, StyleSheet, Text} from 'react-native';
import {colors} from '../../../constants/colors';
import {useEffect, useRef} from 'react';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';

interface CountProps {
  pushUpCount: number;
  isGoingDown: boolean;
}

function Count({pushUpCount, isGoingDown}: CountProps): React.JSX.Element {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(scaleAnim, {
      toValue: isGoingDown ? 0.85 : 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [isGoingDown, scaleAnim]);

  useEffect(() => {
    if (pushUpCount === 0) {
      return;
    }
    ReactNativeHapticFeedback.trigger('impactHeavy', {
      enableVibrateFallback: true,
      ignoreAndroidSystemSettings: false,
    });
  }, [pushUpCount]);

  return (
    <Animated.View
      style={[
        styles.countContainer,
        isGoingDown && styles.countContainerActive,
        {
          transform: [{scale: scaleAnim}],
        },
      ]}>
      <Text style={styles.countText}>{pushUpCount}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  countContainer: {
    borderWidth: 10,
    borderColor: colors.primaryLight,
    borderRadius: 9999,
    width: 250,
    height: 250,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.lightBlue,
  },
  countContainerActive: {
    borderColor: colors.primary,
  },
  countText: {
    fontSize: 70,
    fontWeight: '400',
    color: colors.textLight,
  },
});

export default Count;
