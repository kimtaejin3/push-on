import React from 'react';
import {SafeAreaView, StyleSheet} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import Header from '../components/common/Header';
import {colors} from '../constants/colors';

function SetsSetupScreen() {
  const navigation = useNavigation();
  return (
    <SafeAreaView style={styles.container}>
      <Header title="세트" onBackPress={() => navigation.goBack()} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.backgroundDark},
});

export default SetsSetupScreen;
