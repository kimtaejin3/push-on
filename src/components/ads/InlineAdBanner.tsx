import React, {useEffect, useState} from 'react';
import {
  StyleSheet,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import {
  BannerAd,
  BannerAdSize,
  type RequestOptions,
} from 'react-native-google-mobile-ads';
import {useAds} from '../../hooks/useAds';
import {adRequestOptions, BANNER_AD_UNIT_ID} from '../../constants/ads';
import {color, radius, space} from '../../theme';
import {AdBadge} from './AdBadge';
import {BannerSkeleton} from './AdSkeleton';

// 디자인 Ad/Inline Banner: 적응형이어도 자리는 110 으로 고정해 기록 화면이 밀리지 않게 한다
export const INLINE_AD_BANNER_HEIGHT = 110;

interface Slot {
  width: number;
  height: number;
}

/**
 * 기록 화면용 인라인 적응형 배너.
 * 광고가 꺼져 있으면 아무것도 그리지 않고, 로드 전에는 같은 높이 스켈레톤, 실패하면 자리를 접는다.
 */
export function InlineAdBanner({style}: {style?: StyleProp<ViewStyle>}) {
  const {adsEnabled} = useAds();
  const [requestOptions, setRequestOptions] = useState<RequestOptions | null>(
    null,
  );
  // 배지 아래 남는 자리. 이 폭·높이 안에서만 배너를 요청해 110 고정 틀을 넘지 않게 한다
  const [slot, setSlot] = useState<Slot | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!adsEnabled) {
      return;
    }
    let cancelled = false;
    adRequestOptions()
      .then(options => {
        if (!cancelled) {
          setRequestOptions(options);
        }
      })
      .catch(error => {
        if (!cancelled) {
          console.warn('[광고] 배너 요청 옵션 준비 실패:', error);
          setFailed(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [adsEnabled]);

  if (!adsEnabled || failed) {
    return null;
  }

  const onSlotLayout = (event: LayoutChangeEvent) => {
    const width = Math.floor(event.nativeEvent.layout.width);
    const height = Math.floor(event.nativeEvent.layout.height);
    // 적응형 배너는 요청할 때의 폭으로 크기가 정해지므로, 처음 잰 값을 그대로 쓴다
    if (!slot && width > 0 && height > 0) {
      setSlot({width, height});
    }
  };

  return (
    <View style={[styles.container, style]}>
      <AdBadge />
      <View style={styles.slot} onLayout={onSlotLayout}>
        {requestOptions && slot ? (
          <BannerAd
            unitId={BANNER_AD_UNIT_ID}
            size={BannerAdSize.INLINE_ADAPTIVE_BANNER}
            width={slot.width}
            maxHeight={slot.height}
            requestOptions={requestOptions}
            onAdLoaded={() => setLoaded(true)}
            onAdFailedToLoad={error => {
              console.warn('[광고] 배너 로드 실패:', error);
              setFailed(true);
            }}
          />
        ) : null}
        {loaded ? null : <BannerSkeleton style={StyleSheet.absoluteFill} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: INLINE_AD_BANNER_HEIGHT,
    backgroundColor: color.adSurface,
    borderWidth: 1,
    borderColor: color.adBorder,
    borderRadius: radius.s,
    overflow: 'hidden',
    paddingHorizontal: space[12],
    paddingVertical: 10,
    gap: space[8],
  },
  slot: {flex: 1, alignItems: 'center', justifyContent: 'center'},
});
