import {StyleSheet, View} from 'react-native';
import {useLinkBuilder} from '@react-navigation/native';
import {Text, PlatformPressable} from '@react-navigation/elements';
import {colors} from '../../constants/colors';

function MyTabBar({state, descriptors, navigation}: any) {
  const {buildHref} = useLinkBuilder();

  return (
    <View style={styles.container}>
      {state.routes.map((route: any, index: number) => {
        const {options} = descriptors[route.key];
        const label =
          options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : options.title !== undefined
            ? options.title
            : route.name;

        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          });
        };

        return (
          <PlatformPressable
            key={route.key}
            href={buildHref(route.name, route.params)}
            accessibilityState={isFocused ? {selected: true} : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarButtonTestID}
            onPress={onPress}
            onLongPress={onLongPress}
            style={styles.tabBar}>
            <Text
              style={isFocused ? styles.activeTabText : styles.inactiveTabText}>
              {label}
            </Text>
          </PlatformPressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
  },
  tabBar: {
    flex: 1,
  },
  activeTabText: {
    color: colors.success,
  },
  inactiveTabText: {
    color: colors.tabInactive,
  },
});

export default MyTabBar;
