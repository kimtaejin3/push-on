import React from 'react';
import {CommonActions} from '@react-navigation/native';
import type {BottomTabBarProps} from '@react-navigation/bottom-tabs';
import {Pressable, StyleSheet, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import type {BottomTabParamList} from '../../navigations/BottomTabNavigation';
import {color, radius, space} from '../../theme';
import {Icon, type LucideName} from './Icon';
import {Text} from './Text';

const tabs: Record<
  keyof BottomTabParamList,
  {label: string; icon: LucideName}
> = {
  Home: {label: '홈', icon: 'house'},
  Program: {label: '100개 챌린지', icon: 'route'},
  History: {label: '기록', icon: 'calendar-days'},
  Setting: {label: '설정', icon: 'settings'},
};

const barHeight = 64;

export function useTabBarInset() {
  const {bottom} = useSafeAreaInsets();
  return barHeight + space[8] + Math.max(space[16], bottom);
}

export function TabBar({state, navigation}: BottomTabBarProps) {
  const totalHeight = useTabBarInset();
  const {left, right} = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.wrap,
        {
          height: totalHeight,
          paddingLeft: Math.max(space[16], left),
          paddingRight: Math.max(space[16], right),
        },
      ]}>
      <View style={styles.bar} accessibilityRole="tablist">
        {state.routes.map((route, index) => {
          const {label, icon} = tabs[route.name as keyof BottomTabParamList];
          const selected = index === state.index;
          const tint = selected ? 'active' : 'textMuted';

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!selected && !event.defaultPrevented) {
              navigation.dispatch({
                ...CommonActions.navigate(route.name, route.params),
                target: state.key,
              });
            }
          };

          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityLabel={label}
              accessibilityState={{selected}}
              onPress={onPress}
              onLongPress={() =>
                navigation.emit({type: 'tabLongPress', target: route.key})
              }
              style={[styles.item, selected && styles.selected]}>
              <Icon name={icon} color={tint} size={22} />
              <Text
                color={tint}
                weight={selected ? 700 : 600}
                style={styles.label}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: color.bg,
    paddingTop: space[8],
  },
  bar: {
    height: barHeight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: color.tabBar,
    borderRadius: radius.tabBar,
    borderWidth: 1,
    borderColor: color.border,
    paddingHorizontal: 5,
  },
  item: {
    flexBasis: 84,
    flexShrink: 1,
    height: 52,
    borderRadius: radius.tabItem,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  selected: {backgroundColor: color.activeSoft},
  label: {fontSize: 11, lineHeight: 14, textAlign: 'center'},
});
