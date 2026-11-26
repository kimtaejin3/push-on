import React from 'react';
import {StyleSheet, View} from 'react-native';
import {PRO_PRICE_LABEL} from '../../../constants/purchases';
import {presentProPaywall} from '../../../utils/purchases';
import {space} from '../../../theme';
import {Button} from '../../ui/Button';
import {Card} from '../../ui/Card';
import {Icon} from '../../ui/Icon';
import {Text} from '../../ui/Text';

interface ProLockCardProps {
  title: string;
  description: string;
}

/** Pro 전용 기능 자리에 보이는 안내. 누르면 결제 화면을 띄운다 */
export function ProLockCard({title, description}: ProLockCardProps) {
  return (
    <Card style={styles.card}>
      <View style={styles.head}>
        <Icon name="lock" size={18} color="active" />
        <Text weight={800}>{title}</Text>
      </View>
      <Text color="textMuted" variant="label">
        {description}
      </Text>
      <Button
        variant="secondary"
        icon="sparkles"
        title={`평생 Pro · ${PRO_PRICE_LABEL}`}
        onPress={() => {
          presentProPaywall();
        }}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {gap: space[12]},
  head: {flexDirection: 'row', alignItems: 'center', gap: space[8]},
});
