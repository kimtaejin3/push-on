import {SafeAreaView, StyleSheet, Text} from 'react-native';

function OnboardingScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Text>OnboardingScreen</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default OnboardingScreen;
