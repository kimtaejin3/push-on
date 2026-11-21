import {formatKSTDate} from '../utils/time';

/** 서버(app_config)에서 내려오는 광고 설정 */
export type AdConfig = {
  adsEnabled: boolean;
  interstitialEnabled: boolean;
  dailyCap: number;
  minGapSeconds: number;
  graceWorkouts: number;
};

/** 폰에 저장하는 전면광고 노출 기록 */
export type AdState = {
  date: string; // YYYY-MM-DD (기기 날짜 기준)
  shownToday: number;
  lastShownAt: number | null; // epoch ms
  completedWorkouts: number; // 누적, 날짜가 바뀌어도 초기화하지 않는다
  testDate: string | null; // 마지막으로 테스트(100개 챌린지 테스트·"한 번에 몇 개?")를 한 날, KST YYYY-MM-DD
};

// 설정을 못 읽었을 때 쓰는 값. 광고를 띄우지 않는 쪽으로 실패한다 (fail-closed)
export const ADS_OFF: AdConfig = {
  adsEnabled: false,
  interstitialEnabled: false,
  dailyCap: 1,
  minGapSeconds: 43200,
  graceWorkouts: 3,
};

export const createAdState = (now: Date): AdState => ({
  date: formatKSTDate(now),
  shownToday: 0,
  lastShownAt: null,
  completedWorkouts: 0,
  testDate: null,
});

/**
 * 날짜가 바뀌었으면 오늘 노출 횟수만 초기화한다. 같은 날이면 같은 객체를 그대로 돌려준다.
 * lastShownAt 은 남긴다: 지우면 23:59 노출 뒤 00:01 에 또 뜨거나(최소 간격 무시),
 * 시계를 하루 되돌려 '미래 lastShownAt' 방어를 피할 수 있다.
 */
export const rollDate = (state: AdState, now: Date): AdState => {
  const today = formatKSTDate(now);
  if (state.date === today) {
    return state;
  }
  return {...state, date: today, shownToday: 0};
};

export const shouldShowInterstitial = (
  config: AdConfig,
  state: AdState,
  now: Date,
): boolean => {
  if (!config.adsEnabled || !config.interstitialEnabled) {
    return false;
  }
  // 테스트한 날은 전면을 띄우지 않는다. 100개 달성은 최종 테스트로만 일어나 '100개 달성일' 면제도 여기에 포함된다
  if (state.testDate === formatKSTDate(now)) {
    return false;
  }
  // 판정 시점의 completedWorkouts 에는 방금 끝낸 운동이 들어 있어, 유예 N이면 첫 N회 운동은 면제된다
  if (state.completedWorkouts <= config.graceWorkouts) {
    return false;
  }
  if (state.shownToday >= config.dailyCap) {
    return false;
  }
  // 기기 시계가 과거로 돌아가 lastShownAt 이 미래면 차이가 음수라 노출하지 않는다
  return (
    state.lastShownAt === null ||
    now.getTime() - state.lastShownAt >= config.minGapSeconds * 1000
  );
};

export const recordInterstitialShown = (state: AdState, now: Date): AdState => ({
  ...state,
  shownToday: state.shownToday + 1,
  lastShownAt: now.getTime(),
});

export const recordWorkoutCompleted = (state: AdState): AdState => ({
  ...state,
  completedWorkouts: state.completedWorkouts + 1,
});

/** 테스트를 한 날을 오늘(KST)로 적는다. 그날은 전면을 띄우지 않고, 자정(KST)이 지나면 다시 대상이 된다 */
export const recordTestDay = (state: AdState, now: Date): AdState => ({
  ...state,
  testDate: formatKSTDate(now),
});
