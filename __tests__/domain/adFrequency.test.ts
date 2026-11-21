import {
  ADS_OFF,
  AdConfig,
  AdState,
  rollDate,
  shouldShowInterstitial,
  recordInterstitialShown,
  recordWorkoutCompleted,
} from '../../src/domain/adFrequency';
import {formatKSTDate} from '../../src/utils/time';

const base: AdState = {date: '2026-10-19', shownToday: 0, lastShownAt: null, completedWorkouts: 5};
const on: AdConfig = {...ADS_OFF, adsEnabled: true, interstitialEnabled: true};
const now = new Date('2026-10-19T12:00:00+09:00');

describe('shouldShowInterstitial', () => {
  it('설정이 모두 켜지고 조건을 만족하면 노출한다', () => {
    expect(shouldShowInterstitial(on, base, now)).toBe(true);
  });
  it('ads_enabled 가 꺼져 있으면 노출하지 않는다', () => {
    expect(shouldShowInterstitial({...on, adsEnabled: false}, base, now)).toBe(false);
  });
  it('interstitial_enabled 가 꺼져 있으면 노출하지 않는다', () => {
    expect(shouldShowInterstitial({...on, interstitialEnabled: false}, base, now)).toBe(false);
  });
  it('유예 기간 안이면 노출하지 않는다 (첫 운동 면제)', () => {
    expect(shouldShowInterstitial(on, {...base, completedWorkouts: 1}, now)).toBe(false);
    expect(shouldShowInterstitial(on, {...base, completedWorkouts: 2}, now)).toBe(true);
  });
  it('일일 한도에 도달하면 노출하지 않는다', () => {
    expect(shouldShowInterstitial(on, {...base, shownToday: 2}, now)).toBe(false);
  });
  it('최소 간격이 지나지 않았으면 노출하지 않는다', () => {
    const recent = {...base, shownToday: 1, lastShownAt: now.getTime() - 179_000};
    expect(shouldShowInterstitial(on, recent, now)).toBe(false);
    const old = {...base, shownToday: 1, lastShownAt: now.getTime() - 180_000};
    expect(shouldShowInterstitial(on, old, now)).toBe(true);
  });
  it('기기 시계가 과거로 돌아가 lastShownAt 이 미래여도 노출하지 않는다', () => {
    const future = {...base, shownToday: 1, lastShownAt: now.getTime() + 60_000};
    expect(shouldShowInterstitial(on, future, now)).toBe(false);
  });
});

describe('rollDate', () => {
  it('날짜가 바뀌면 shownToday 만 초기화하고 lastShownAt 은 유지한다', () => {
    // 정오로 둬 기기 시간대(UTC−3…UTC+14)와 관계없이 10월 19일이 되게 한다
    const next = rollDate({date: '2026-10-18', shownToday: 2, lastShownAt: 1, completedWorkouts: 5}, now);
    expect(next).toEqual({date: '2026-10-19', shownToday: 0, lastShownAt: 1, completedWorkouts: 5});
  });
  it('자정 직전에 노출했으면 자정 직후에도 최소 간격이 지나기 전엔 노출하지 않는다', () => {
    // 날짜 문자열은 formatKSTDate 로 만들어 기기 시간대와 관계없이 "전날 → 다음날" 이 되게 한다
    const shownAt = new Date(2026, 9, 18, 23, 59, 0);
    const checkAt = new Date(2026, 9, 19, 0, 1, 0);
    const state = recordInterstitialShown(
      {date: formatKSTDate(shownAt), shownToday: 0, lastShownAt: null, completedWorkouts: 5},
      shownAt,
    );
    const rolled = rollDate(state, checkAt);
    expect(rolled.shownToday).toBe(0);
    expect(shouldShowInterstitial(on, rolled, checkAt)).toBe(false);
  });
  it('같은 날이면 상태를 그대로 돌려준다', () => {
    const same = {date: '2026-10-19', shownToday: 1, lastShownAt: 10, completedWorkouts: 5};
    expect(rollDate(same, now)).toBe(same);
  });
});

describe('recordInterstitialShown / recordWorkoutCompleted', () => {
  it('노출을 기록하면 횟수와 시각이 갱신된다', () => {
    expect(recordInterstitialShown(base, now)).toMatchObject({shownToday: 1, lastShownAt: now.getTime()});
  });
  it('운동 완료를 기록하면 누적 수가 1 늘어난다', () => {
    expect(recordWorkoutCompleted(base).completedWorkouts).toBe(6);
  });
});
