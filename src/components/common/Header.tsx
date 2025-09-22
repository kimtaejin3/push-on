import {View, Text, StyleSheet} from 'react-native';
import Fontawesome5 from '@react-native-vector-icons/fontawesome5';

function Header() {
  return (
    <View style={styles.header}>
      {/* profile */}
      <View style={styles.profileContainer}>
        <Fontawesome5 name="home" size={18} iconStyle="solid" color="#242424" />
        <Text>PumpUp</Text>
      </View>
      <View style={styles.headerIcons}>
        <Fontawesome5 name="cog" size={20} iconStyle="solid" color="#242424" />
        <Fontawesome5 name="bell" size={20} iconStyle="solid" color="#242424" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  profileContainer: {
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

export default Header;
