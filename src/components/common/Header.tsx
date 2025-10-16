import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import Fontawesome5 from '@react-native-vector-icons/fontawesome5';
import {colors} from '../../constants/colors';

interface HeaderProps {
  title: string;
  onBackPress: () => void;
  showBackButton?: boolean;
}

function Header({title, onBackPress, showBackButton = true}: HeaderProps) {
  return (
    <View style={styles.header}>
      {showBackButton ? (
        <TouchableOpacity style={styles.backButton} onPress={onBackPress}>
          <Fontawesome5
            name="arrow-left"
            size={20}
            iconStyle="solid"
            color={colors.textLight}
          />
        </TouchableOpacity>
      ) : (
        <View style={styles.placeholder} />
      )}
      <Text style={styles.headerTitle}>{title}</Text>
      <View style={styles.placeholder} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.primary,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textLight,
  },
  placeholder: {
    width: 36,
  },
});

export default Header;
