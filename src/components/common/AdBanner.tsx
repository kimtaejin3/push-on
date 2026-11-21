import React, {useState} from 'react';
import {BannerAd, BannerAdSize} from 'react-native-google-mobile-ads';
import {useAds} from '../../hooks/useAds';
import {AD_REQUEST_OPTIONS, BANNER_AD_UNIT_ID} from '../../constants/ads';

/** 서버 설정에서 광고가 꺼져 있거나 아직 못 읽었으면 아무것도 그리지 않는다 */
export function AdBanner() {
  const {adsEnabled} = useAds();
  // 로드에 실패하면 빈 영역이 남지 않도록 통째로 걷어낸다
  const [failed, setFailed] = useState(false);

  if (!adsEnabled || failed) {
    return null;
  }

  return (
    <BannerAd
      unitId={BANNER_AD_UNIT_ID}
      size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
      requestOptions={AD_REQUEST_OPTIONS}
      onAdFailedToLoad={error => {
        console.warn('[광고] 배너 로드 실패:', error);
        setFailed(true);
      }}
    />
  );
}
