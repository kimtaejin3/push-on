import React from 'react';
import {StyleSheet, Text, View, TouchableOpacity} from 'react-native';
import FontAwesome5 from '@react-native-vector-icons/fontawesome5';
import {colors} from '../../constants/colors';

interface SettingItemProps {
  icon: string;
  title: string;
  onPress: () => void;
  showArrow?: boolean;
  isDestructive?: boolean;
}

const SettingItem: React.FC<SettingItemProps> = ({
  icon,
  title,
  onPress,
  showArrow = true,
  isDestructive = false,
}) => (
  <TouchableOpacity style={styles.settingItem} onPress={onPress}>
    <View style={styles.settingItemLeft}>
      <FontAwesome5
        name={icon as any}
        size={20}
        iconStyle="solid"
        color={isDestructive ? colors.error : colors.textLight}
      />
      <Text
        style={[
          styles.settingItemText,
          isDestructive && styles.destructiveText,
        ]}>
        {title}
      </Text>
    </View>
    {showArrow && (
      <FontAwesome5
        name="chevron-right"
        size={16}
        iconStyle="solid"
        color={colors.gray400}
      />
    )}
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingItemText: {
    fontSize: 16,
    color: colors.textLight,
    marginLeft: 12,
  },
  destructiveText: {
    color: colors.error,
  },
});

export default SettingItem;

