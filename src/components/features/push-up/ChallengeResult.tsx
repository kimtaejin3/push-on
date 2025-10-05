import React from 'react';
import {SafeAreaView, StyleSheet, Text, View, Dimensions} from 'react-native';
import CustomButton from '../../common/CustomButton';
import {colors} from '../../../constants/colors';
import FontAwesome5 from '@react-native-vector-icons/fontawesome5';

interface ChallengeResultProps {
  pushUpCount: number;
  duration: string;
  onSaveAndGoHome: () => void;
}

const generateCircles = () => {
  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;
  const circles = [];

  for (let i = 0; i < 30; i++) {
    const size = Math.random() * 8 + 4; // 4-12px 크기
    const opacity = Math.random() * 0.3 + 0.1; // 0.1-0.4 투명도
    const left = Math.random() * screenWidth;
    const top = Math.random() * screenHeight;

    circles.push(
      <View
        key={i}
        style={[
          styles.circle,
          {
            width: size,
            height: size,
            left: left,
            top: top,
            opacity: opacity,
          },
        ]}
      />,
    );
  }
  return circles;
};

function ChallengeResult({
  pushUpCount,
  duration,
  onSaveAndGoHome,
}: ChallengeResultProps): React.JSX.Element {
  return (
    <SafeAreaView style={styles.safeArea}>
      {/* 동그라미 패턴 배경 */}
      <View style={styles.backgroundPattern}>{generateCircles()}</View>

      <View style={styles.container}>
        <View style={styles.header}>
          <FontAwesome5
            name="check-circle"
            iconStyle="solid"
            size={60}
            color={colors.success}
          />
          <Text style={styles.title}>훌륭해요!</Text>
          <Text style={styles.subtitle}>세트를 완료했습니다</Text>
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
    backgroundColor: colors.grayLight,
  },
  backgroundPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  circle: {
    position: 'absolute',
    borderRadius: 50,
    backgroundColor: colors.primary,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
    zIndex: 1,
  },
  header: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.gray800,
    marginTop: 20,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: colors.gray600,
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
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
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
    color: colors.gray600,
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
