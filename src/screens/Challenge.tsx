import React from 'react';
import {SafeAreaView, StyleSheet, Text, View} from 'react-native';
import usePushUpManager from '../hooks/usePushUpManager';
import CustomButton from '../components/common/CustomButton';
import {useNavigation} from '@react-navigation/native';

function Challenge(): React.JSX.Element {
  const navigation = useNavigation();

  const {count, isTracking, toggleTracking} = usePushUpManager();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>SET 1</Text>

        <Text style={styles.countText}>{count}</Text>
        {/* <Text style={styles.encouragementText}>{encouragement}</Text> */}

        <Text style={styles.instructionText}>
          {!isTracking && '기기를 얼굴과 마주보게 바닥에 두세요'}
        </Text>
        <CustomButton
          title={isTracking ? '중지하기' : '시작하기'}
          variant={isTracking ? 'stop' : 'start'}
          onPress={() => {
            toggleTracking();
            if (isTracking) {
              navigation.goBack();
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
    marginTop: 'auto',
    marginBottom: 10,
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.7,
  },
  encouragementText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#FF6969',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
});

export default Challenge;
