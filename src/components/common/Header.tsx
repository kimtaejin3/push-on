import React from 'react';
import {View, StyleSheet, Text} from 'react-native';
import Fontawesome5 from '@react-native-vector-icons/fontawesome5';

interface HeaderProps {
  left: React.ReactNode;
  right?: React.ReactNode;
}

function Header({left, right}: HeaderProps) {
  return (
    <View style={styles.header}>
      {left}
      <View style={styles.headerIcons}>{right}</View>
    </View>
  );
}

function HeaderTitle({title, icon}: {title: string; icon: React.ReactNode}) {
  return (
    <View style={styles.NavigationTitle}>
      {icon}
      <Text>{title}</Text>
    </View>
  );
}

//TODO: 이 Notification은 굳이 Header.tsx에 포함되지 않아도 될 것 같아.
function Notification() {
  return (
    <Fontawesome5 name="bell" size={20} iconStyle="solid" color="#242424" />
  );
}

//TODO: 이 Setting은 굳이 Header.tsx에 포함되지 않아도 될 것 같아.
function Setting() {
  return (
    <Fontawesome5 name="cog" size={20} iconStyle="solid" color="#242424" />
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  NavigationTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    padding: 15,
    gap: 10,
    borderRadius: 9999,
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 25,
  },
});

export {Header, HeaderTitle, Notification, Setting};
