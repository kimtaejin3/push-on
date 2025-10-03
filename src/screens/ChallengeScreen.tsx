import React from 'react';
import {SafeAreaView, StyleSheet, Text, View} from 'react-native';
import usePushUpManager from '../hooks/usePushUpManager';
import CustomButton from '../components/common/CustomButton';
import {useNavigation} from '@react-navigation/native';
import Engagement from '../components/features/push-up/Engagement';
import {colors} from '../constants/colors';

function ChallengeScreen(): React.JSX.Element {
  const navigation = useNavigation();

  const {pushUpCount, isTracking, startTracking, stopTracking} =
    usePushUpManager();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>SET 1</Text>

        <Text style={styles.countText}>{pushUpCount}</Text>
        <Engagement show={isTracking} pushUpCount={pushUpCount} />

        <Text style={styles.instructionText}>
          {!isTracking && '기기를 얼굴과 마주보게 바닥에 두세요'}
        </Text>

        <CustomButton
          style={styles.button}
          title={isTracking ? '중지하기' : '시작하기'}
          variant={isTracking ? 'stop' : 'start'}
          onPress={() => {
            if (isTracking) {
              stopTracking();
              navigation.goBack();
            } else {
              startTracking();
            }
          }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 40,
  },
  countText: {
    fontSize: 80,
    fontWeight: '400',
    marginTop: 100,
  },
  countLabel: {
    fontSize: 30,
    fontWeight: 'bold',
    marginBottom: 15,
    marginLeft: 5,
  },
  instructionText: {
    marginTop: 60,
    marginBottom: 10,
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.7,
  },
  button: {
    width: 300,
    backgroundColor: colors.primaryDark,
  },
});

export default ChallengeScreen;
