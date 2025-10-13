import React, {useEffect, useRef} from 'react';
import {SafeAreaView, StyleSheet, Text, View, Animated} from 'react-native';
import CustomButton from '../../common/CustomButton';
import {colors} from '../../../constants/colors';
import FontAwesome5 from '@react-native-vector-icons/fontawesome5';

interface ChallengeResultProps {
  pushUpCount: number;
  duration: string;
  onSaveAndGoHome: () => void;
}

function ChallengeResult({
  pushUpCount,
  duration,
  onSaveAndGoHome,
}: ChallengeResultProps): React.JSX.Element {
  const iconAnim = useRef(new Animated.Value(0)).current;
  const titleAnim = useRef(new Animated.Value(0)).current;
  const subtitleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 순차적으로 애니메이션 실행
    Animated.sequence([
      // 아이콘 애니메이션 (첫 번째)
      Animated.timing(iconAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      // 제목 애니메이션 (두 번째)
      Animated.timing(titleAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      // 부제목 애니메이션 (세 번째)
      Animated.timing(subtitleAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [iconAnim, titleAnim, subtitleAnim]);
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Animated.View
            style={{
              transform: [
                {
                  scale: iconAnim.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0, 1.2, 1],
                  }),
                },
                {
                  rotate: iconAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '360deg'],
                  }),
                },
              ],
              opacity: iconAnim,
            }}>
            <FontAwesome5
              name="check-circle"
              iconStyle="solid"
              size={60}
              color={colors.primary}
            />
          </Animated.View>
          <Animated.Text
            style={[
              styles.title,
              {
                opacity: titleAnim,
                transform: [
                  {
                    translateY: titleAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [30, 0],
                    }),
                  },
                ],
              },
            ]}>
            훌륭해요!
          </Animated.Text>
          <Animated.Text
            style={[
              styles.subtitle,
              {
                opacity: subtitleAnim,
                transform: [
                  {
                    translateY: subtitleAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 0],
                    }),
                  },
                ],
              },
            ]}>
            세트를 완료했습니다
          </Animated.Text>
        </View>

        <View style={styles.resultContainer}>
          <View style={styles.resultItem}>
            <Text style={styles.resultNumber}>{pushUpCount}</Text>
            <Text style={styles.resultLabel}>푸쉬업</Text>
          </View>

          <View style={styles.resultItem}>
            <Text style={styles.resultNumber}>{duration}</Text>
            <Text style={styles.resultLabel}>소요시간</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <CustomButton
            style={styles.saveButton}
            title="기록하고 홈으로"
            variant="start"
            onPress={onSaveAndGoHome}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.backgroundDark,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.textLight,
    marginTop: 20,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: colors.gray400,
    textAlign: 'center',
  },
  resultContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 60,
  },
  resultItem: {
    alignItems: 'center',
    backgroundColor: colors.overlayMedium,
    padding: 30,
    borderRadius: 20,
    minWidth: 120,
    shadowColor: colors.gray900,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  resultNumber: {
    fontSize: 36,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 8,
  },
  resultLabel: {
    fontSize: 16,
    color: colors.gray400,
    fontWeight: '500',
  },
  footer: {
    marginTop: 'auto',
    width: '100%',
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: colors.primaryDark,
    shadowColor: colors.primary,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});

export default ChallengeResult;
