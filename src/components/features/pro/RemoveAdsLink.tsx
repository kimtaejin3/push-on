import React from 'react';
import {StyleSheet, View} from 'react-native';
import {PRO_PRICE_LABEL, REVENUECAT_API_KEY} from '../../../constants/purchases';
import {useAds} from '../../../hooks/useAds';
import {usePro} from '../../../hooks/usePro';
import {presentProPaywall} from '../../../utils/purchases';
import {space} from '../../../theme';
import {Button} from '../../ui/Button';

/**
 * 광고 아래 "광고 없이 쓰기" 링크 (디자인 05 오늘 결과 · 광고).
 * 광고가 보이는 사람에게만 보인다. Pro·광고 꺼짐·결제 불가 빌드에서는 그리지 않는다.
 */
export function RemoveAdsLink() {
  const {adsEnabled} = useAds();
  const isPro = usePro();
  if (!adsEnabled || isPro || !REVENUECAT_API_KEY) {
    return null;
  }
  return (
    <View style={styles.wrap}>
      <Button
        variant="text"
        title={`광고 없이 쓰기 · ${PRO_PRICE_LABEL} 한 번`}
        onPress={() => {
          presentProPaywall();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  // 확인 버튼과 44 이상 떨어지게 (잘못 누름 방지)
  wrap: {alignItems: 'center', marginTop: -space[16], marginBottom: space[24]},
});
