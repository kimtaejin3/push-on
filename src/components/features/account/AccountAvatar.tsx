import React, {useState} from 'react';
import {Image, StyleSheet, View} from 'react-native';
import {color, radius} from '../../../theme';
import {Text} from '../../ui/Text';

interface AccountAvatarProps {
  name: string;
  size: number;
  imageUri?: string;
}

export function AccountAvatar({name, size, imageUri}: AccountAvatarProps) {
  const [failedUri, setFailedUri] = useState<string>();
  const [initial] = Array.from(name.trim());

  return (
    <View style={[styles.avatar, {width: size, height: size}]}>
      {imageUri && imageUri !== failedUri ? (
        <Image
          source={{uri: imageUri}}
          style={styles.image}
          onError={() => setFailedUri(imageUri)}
        />
      ) : (
        <Text variant={size > 64 ? 'title' : 'headline'} weight={800}>
          {initial?.toUpperCase() || '?'}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: color.surface2,
    overflow: 'hidden',
  },
  image: {width: '100%', height: '100%'},
});
