import React from 'react';
import {StyleSheet, Text, View, Animated} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import CustomButton from '../../common/CustomButton';
import {colors} from '../../../constants/colors';
import FontAwesome5 from '@react-native-vector-icons/fontawesome5';
import {useNavigation} from '@react-navigation/native';
import {useSavePushupSessionMutation} from '../../../tanstack-query';
import {
  useSequentialAnimation,
  createScaleRotateStyle,
  createFadeInStyle,
} from '../../../hooks/useSequentialAnimation';

interface ChallengeResultProps {
  pushUpCount: number;
  duration: number;
}

function ChallengeResult({
  pushUpCount,
  duration,
}: ChallengeResultProps): React.JSX.Element {
  const [iconAnim, titleAnim, subtitleAnim] = useSequentialAnimation(3, {
    durations: [500, 400, 300],
  });
  const navigation = useNavigation();

  const savePushupMutation = useSavePushupSessionMutation(
    () => {
      navigation.navigate('Tabs' as never);
    },
    error => {
      console.error('푸쉬업 세션 저장 실패:', error);
      navigation.navigate('Tabs' as never);
    },
  );

  const handleSaveAndGoHome = () => {
    if (pushUpCount === 0) {
      return;
    }
    savePushupMutation.mutate({
      reps: pushUpCount,
      duration_seconds: duration,
      set_number: 1,
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Animated.View style={createScaleRotateStyle(iconAnim)}>
            {pushUpCount > 0 ? (
              <FontAwesome5
                name="check-circle"
                iconStyle="solid"
                size={60}
                color={colors.primary}
              />
            ) : (
              <FontAwesome5
                name="times-circle"
                iconStyle="solid"
                size={60}
                color={colors.primary}
              />
            )}
          </Animated.View>
          <Animated.Text
            style={[
              styles.title,
              pushUpCount === 0 && styles.titleError,
              createFadeInStyle(titleAnim, 30),
            ]}>
            {pushUpCount > 0 ? '훌륭해요!' : '측정된 푸쉬업 횟수가 없어요!'}
          </Animated.Text>
          <Animated.Text
            style={[styles.subtitle, createFadeInStyle(subtitleAnim, 20)]}>
            {pushUpCount > 0 ? '세트를 완료했습니다' : '다시 시도해보세요!'}
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
            title={pushUpCount > 0 ? '기록하고 홈으로 이동' : '홈으로 이동'}
            variant="start"
            onPress={() => {
              if (pushUpCount > 0) {
                handleSaveAndGoHome();
              } else {
                navigation.navigate('Tabs', {
                  screen: 'Home',
                });
              }
            }}
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
  titleError: {
    fontSize: 24,
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
