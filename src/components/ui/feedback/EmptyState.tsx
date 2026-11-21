import React from 'react';
import {StyleSheet, View} from 'react-native';
import {color, layout, radius, space} from '../../../theme';
import {Button} from '../Button';
import {Icon} from '../Icon';
import {Text} from '../Text';

export interface StateProps {
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState(props: StateProps) {
  return <FeedbackState {...props} tone="empty" />;
}

export function FeedbackState({
  title,
  message,
  actionLabel,
  onAction,
  tone,
}: StateProps & {tone: 'empty' | 'error'}) {
  const isError = tone === 'error';

  return (
    <View style={styles.container}>
      <View style={[styles.icon, isError && styles.errorIcon]}>
        <Icon
          name={isError ? 'cloud-off' : 'inbox'}
          color={isError ? 'alert' : 'active'}
          size={32}
        />
      </View>
      <View style={styles.copy}>
        <Text variant="headline" weight={800} style={styles.title}>
          {title}
        </Text>
        {message ? (
          <Text color="textMuted" style={styles.message}>
            {message}
          </Text>
        ) : null}
      </View>
      {actionLabel && onAction ? (
        <View style={styles.action}>
          <Button
            variant={isError ? 'secondary' : 'primary'}
            title={actionLabel}
            onPress={onAction}
            icon={isError ? 'rotate-cw' : 'play'}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'center',
    alignItems: 'center',
    width: '100%',
    maxWidth: layout.frameWidth - 2 * layout.screenPadding,
    paddingVertical: space[32],
    paddingHorizontal: space[8],
    gap: space[20],
  },
  icon: {
    width: 72,
    height: 72,
    borderRadius: radius.pill,
    backgroundColor: color.activeTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorIcon: {backgroundColor: `${color.alert}26`},
  copy: {width: '100%', gap: space[8]},
  title: {fontSize: 20, lineHeight: 28, textAlign: 'center'},
  message: {fontSize: 15, lineHeight: 21, textAlign: 'center'},
  action: {width: '100%'},
});
