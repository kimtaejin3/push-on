import React, {type ReactNode} from 'react';
import {ScrollView, StyleSheet, View} from 'react-native';
import {color, layout, space} from '../../../theme';
import {Button} from '../../ui/Button';
import {Chip} from '../../ui/Chip';
import {Text} from '../../ui/Text';

const confetti = [
  [10, 36, 6, 14, -20, color.record],
  [28, 86, 10, 6, 30, color.active],
  [76, 46, 10, 6, -45, color.rest],
  [89, 116, 6, 14, 15, color.record],
  [18, 156, 10, 6, -60, color.rest],
  [64, 6, 10, 6, -10, color.active],
  [48, 66, 6, 14, 50, color.record],
  [84, 206, 10, 6, -35, color.active],
  [8, 246, 10, 6, 20, color.record],
  [41, 16, 6, 14, -25, color.rest],
  [71, 146, 10, 6, -70, color.record],
  [23, 306, 10, 6, 40, color.active],
] as const;

export default function MilestoneScreen({
  children,
  onRestart,
}: {
  children: ReactNode;
  onRestart: () => void;
}) {
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          {confetti.map(
            ([left, top, width, height, rotation, backgroundColor]) => (
              <View
                key={left}
                style={[
                  styles.confetti,
                  {
                    left: `${left}%`,
                    top,
                    width,
                    height,
                    backgroundColor,
                    transform: [{rotate: `${rotation}deg`}],
                  },
                ]}
              />
            ),
          )}
        </View>
        <Chip label="6주 완주" tone="record" />
        <Text variant="display" color="record" style={styles.hundred}>
          100
        </Text>
        <Text variant="title" style={styles.heading}>
          쉬지 않고 100개, 해냈어요
        </Text>
      </View>
      {children}
      <View>
        <Button
          variant="text"
          title="다음 목표 정하기"
          icon="chevron-right"
          onPress={onRestart}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: layout.screenPadding,
    paddingBottom: space[24],
    gap: space[24],
  },
  hero: {
    flexGrow: 1,
    alignSelf: 'stretch',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: space[48],
    gap: space[8],
  },
  confetti: {position: 'absolute', borderRadius: 1},
  hundred: {fontSize: 200, lineHeight: 180},
  heading: {textAlign: 'center'},
});
