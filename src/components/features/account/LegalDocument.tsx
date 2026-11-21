import React, {useRef, type ReactNode} from 'react';
import {Pressable, ScrollView, StyleSheet, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {color, layout, radius, space} from '../../../theme';
import {ScreenHeader} from '../../ui/ScreenHeader';
import {Text} from '../../ui/Text';

interface LegalDocumentProps {
  title: string;
  heading: string;
  date: string;
  introduction?: ReactNode;
  articles: {title: string; body: ReactNode}[];
  supplementary: ReactNode;
  contact: {title: string; body: ReactNode};
}

export function LegalDocument({
  title,
  heading,
  date,
  introduction,
  articles,
  supplementary,
  contact,
}: LegalDocumentProps) {
  const navigation = useNavigation();
  const scroll = useRef<ScrollView>(null);
  const offsets = useRef<number[]>([]);

  return (
    <SafeAreaView style={styles.screen}>
      <ScreenHeader title={title} onBack={() => navigation.goBack()} />
      <ScrollView ref={scroll} contentContainerStyle={styles.content}>
        <View style={styles.heading}>
          <Text variant="headline" weight={800}>
            {heading}
          </Text>
          <Text variant="caption" color="textMuted">
            {date}
          </Text>
        </View>
        <View style={styles.contents}>
          <Text variant="caption" color="textMuted">
            목차
          </Text>
          {articles.map((article, index) => (
            <Pressable
              key={article.title}
              accessibilityRole="button"
              onPress={() => {
                const y = offsets.current[index];
                if (y !== undefined) {
                  scroll.current?.scrollTo({y: Math.max(0, y - space[8])});
                }
              }}
              style={({pressed}) => [styles.entry, pressed && styles.pressed]}>
              <Text variant="label" color="active" numeric weight={800}>
                {index + 1}
              </Text>
              <Text variant="label" style={styles.entryTitle}>
                {article.title}
              </Text>
            </Pressable>
          ))}
        </View>
        {introduction ? <DocumentBody>{introduction}</DocumentBody> : null}
        {articles.map((article, index) => (
          <View
            key={article.title}
            style={styles.section}
            onLayout={event => {
              offsets.current[index] = event.nativeEvent.layout.y;
            }}>
            <View accessibilityRole="header">
              <Text weight={800}>
                제{index + 1}조 ({article.title})
              </Text>
            </View>
            <DocumentBody>{article.body}</DocumentBody>
          </View>
        ))}
        <View style={styles.section}>
          <View accessibilityRole="header">
            <Text weight={800}>부칙</Text>
          </View>
          <DocumentBody>{supplementary}</DocumentBody>
        </View>
        <View style={[styles.contents, styles.section]}>
          <View accessibilityRole="header">
            <Text weight={800}>{contact.title}</Text>
          </View>
          <DocumentBody>{contact.body}</DocumentBody>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function DocumentBody({children}: {children: ReactNode}) {
  return <Text style={styles.body}>{children}</Text>;
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: color.bg},
  content: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: space[12],
    paddingBottom: space[32],
    gap: space[24],
  },
  heading: {gap: space[4]},
  contents: {
    backgroundColor: color.surface,
    borderRadius: radius.m,
    padding: space[16],
  },
  entry: {
    minHeight: layout.touchMin,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[8],
  },
  entryTitle: {flex: 1},
  pressed: {opacity: 0.7},
  section: {gap: space[8]},
  body: {fontSize: 15, lineHeight: 24},
});
