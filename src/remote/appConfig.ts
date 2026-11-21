import {supabase} from '../lib/supabase';
import {AdConfig, ADS_OFF} from '../domain/adFrequency';

interface AppConfigRow {
  ads_enabled: boolean;
  interstitial_enabled: boolean;
  interstitial_daily_cap: number;
  interstitial_min_gap_seconds: number;
  interstitial_grace_workouts: number;
}

/**
 * 서버의 광고 설정(app_config 의 default 행).
 * 오프라인 등으로 못 읽거나 행이 없으면 광고를 띄우지 않는다 (fail-closed).
 */
export const getAdConfig = async (): Promise<AdConfig> => {
  try {
    const {data, error} = await supabase
      .from('app_config')
      .select(
        'ads_enabled, interstitial_enabled, interstitial_daily_cap, interstitial_min_gap_seconds, interstitial_grace_workouts',
      )
      .eq('id', 'default')
      .maybeSingle<AppConfigRow>();
    if (error) {
      console.warn('광고 설정 조회 실패:', error);
      return ADS_OFF;
    }
    if (!data) {
      return ADS_OFF;
    }
    return {
      adsEnabled: data.ads_enabled,
      interstitialEnabled: data.interstitial_enabled,
      dailyCap: data.interstitial_daily_cap,
      minGapSeconds: data.interstitial_min_gap_seconds,
      graceWorkouts: data.interstitial_grace_workouts,
    };
  } catch (error) {
    console.warn('광고 설정 조회 중 오류:', error);
    return ADS_OFF;
  }
};
