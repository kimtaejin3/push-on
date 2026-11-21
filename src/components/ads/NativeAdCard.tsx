import React, {useEffect, useState} from 'react';
import {
  Image,
  Platform,
  StyleSheet,
  Text as NativeText,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import {
  NativeAd,
  NativeAdChoicesPlacement,
  NativeAdView,
  NativeAsset,
  NativeAssetType,
  NativeMediaAspectRatio,
  NativeMediaView,
} from 'react-native-google-mobile-ads';
import {useAds} from '../../hooks/useAds';
import {adRequestOptions} from '../../constants/ads';
import {color, fontFamilyFor, radius, space} from '../../theme';
import {AdBadge} from './AdBadge';
import {AdSkeleton} from './AdSkeleton';

interface NativeAdCardProps {
  unitId: string;
  style?: StyleProp<ViewStyle>;
}

type LoadState =
  | {status: 'loading'}
  | {status: 'loaded'; ad: NativeAd}
  | {status: 'failed'};

const LOADING: LoadState = {status: 'loading'};

/*
 * NativeAsset 은 자식에 ref 를 달아 네이티브 뷰를 SDK 에 등록한다.
 * ui/Text 는 ref 를 넘기지 않고 줄 수 제한도 없어서, 광고 글자는 RN Text 에 테마 글꼴을 직접 입힌다.
 */
const asta = (weight: 500 | 700) =>
  fontFamilyFor('ko', weight, Platform.OS === 'ios' ? 'ios' : 'android');

/**
 * 디자인 Ad/Native Medium (홈·결과·리더보드).
 * 광고가 꺼져 있으면(서버 설정 꺼짐·동의 전·SDK 준비 전) 스켈레톤도 그리지 않는다.
 * 로드 전에는 같은 높이 스켈레톤으로 자리를 잡고, 실패하면 자리를 통째로 접는다.
 */
export function NativeAdCard({unitId, style}: NativeAdCardProps) {
  const {adsEnabled} = useAds();
  const [load, setLoad] = useState<LoadState>(LOADING);

  useEffect(() => {
    if (!adsEnabled) {
      return;
    }
    let cancelled = false;
    let loadedAd: NativeAd | null = null;

    (async () => {
      try {
        const options = await adRequestOptions();
        const ad = await NativeAd.createForAdRequest(unitId, {
          ...options,
          // 네이티브 동영상은 소리 없이 시작한다
          startVideoMuted: true,
          aspectRatio: NativeMediaAspectRatio.LANDSCAPE,
          // 우상단 24px 자리를 비워 두고 SDK 가 AdChoices 를 그리게 한다
          adChoicesPlacement: NativeAdChoicesPlacement.TOP_RIGHT,
        });
        if (cancelled) {
          ad.destroy();
          return;
        }
        loadedAd = ad;
        setLoad({status: 'loaded', ad});
      } catch (error) {
        if (!cancelled) {
          console.warn('[광고] 네이티브 광고 로드 실패:', error);
          setLoad({status: 'failed'});
        }
      }
    })();

    return () => {
      cancelled = true;
      // 화면을 떠나거나 광고 단위가 바뀌면 받은 광고를 놓아주고, 다음 요청은 스켈레톤부터 다시 시작한다
      loadedAd?.destroy();
      setLoad(LOADING);
    };
  }, [adsEnabled, unitId]);

  if (!adsEnabled || load.status === 'failed') {
    return null;
  }
  if (load.status === 'loading') {
    return <AdSkeleton style={style} />;
  }

  const {ad} = load;
  const iconUrl = ad.icon?.url;

  // 클릭 영역은 NativeAsset 으로 감싼 제목·아이콘·미디어·CTA 뿐이다. 카드 패딩·빈 곳·본문은 감싸지 않는다
  return (
    <NativeAdView nativeAd={ad} style={[styles.card, style]}>
      <View style={styles.top}>
        <AdBadge />
        <View style={styles.adChoicesSlot} />
      </View>

      <View style={styles.head}>
        {iconUrl ? (
          <NativeAsset assetType={NativeAssetType.ICON}>
            <Image source={{uri: iconUrl}} style={styles.icon} />
          </NativeAsset>
        ) : null}
        <View style={styles.texts}>
          <NativeAsset assetType={NativeAssetType.HEADLINE}>
            <NativeText numberOfLines={1} style={styles.headline}>
              {ad.headline}
            </NativeText>
          </NativeAsset>
          {ad.body ? (
            <NativeText numberOfLines={2} style={styles.body}>
              {ad.body}
            </NativeText>
          ) : null}
        </View>
      </View>

      <NativeMediaView resizeMode="contain" style={styles.media} />

      {ad.callToAction ? (
        <NativeAsset assetType={NativeAssetType.CALL_TO_ACTION}>
          {/* 중립 외곽선 버튼. 브랜드 보라를 쓰면 앱 버튼으로 오인돼 위장 광고가 된다 */}
          <View collapsable={false} style={styles.cta}>
            <NativeText numberOfLines={1} style={styles.ctaLabel}>
              {ad.callToAction}
            </NativeText>
          </View>
        </NativeAsset>
      ) : null}
    </NativeAdView>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: color.adSurface,
    borderWidth: 1,
    borderColor: color.adBorder,
    borderRadius: radius.m,
    padding: 14,
    gap: space[12],
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  // SDK 가 그리는 AdChoices 아이콘 자리. 다른 요소로 가리지 않는다
  adChoicesSlot: {width: 24, height: 24},
  head: {flexDirection: 'row', alignItems: 'center', gap: space[12]},
  icon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: color.adMedia,
  },
  texts: {flex: 1, gap: 2},
  headline: {
    color: color.text,
    fontFamily: asta(700),
    fontSize: 16,
    lineHeight: 20,
    includeFontPadding: false,
  },
  body: {
    color: color.adBody,
    fontFamily: asta(500),
    fontSize: 14,
    lineHeight: 20,
    includeFontPadding: false,
  },
  media: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: radius.s,
    overflow: 'hidden',
    backgroundColor: color.adMedia,
  },
  cta: {
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: color.adCtaStroke,
    borderRadius: radius.s,
    paddingHorizontal: space[16],
  },
  ctaLabel: {
    color: color.text,
    fontFamily: asta(700),
    fontSize: 15,
    lineHeight: 18,
    includeFontPadding: false,
  },
});
