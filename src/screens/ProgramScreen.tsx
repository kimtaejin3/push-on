import React from 'react';
import {SafeAreaView, StyleSheet} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import Header from '../components/common/Header';
import {colors} from '../constants/colors';

function ProgramScreen() {
  const navigation = useNavigation();
  return (
    <SafeAreaView style={styles.container}>
      <Header title="100개 만들기" onBackPress={() => navigation.goBack()} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.backgroundDark},
});

export default ProgramScreen;
