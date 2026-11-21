import {
  ADS_OFF,
  AdConfig,
  AdState,
  rollDate,
  shouldShowInterstitial,
  recordInterstitialShown,
  recordWorkoutCompleted,
} from '../../src/domain/adFrequency';

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
  it('날짜가 바뀌면 shownToday 와 lastShownAt 을 초기화한다', () => {
    const next = rollDate({date: '2026-10-18', shownToday: 2, lastShownAt: 1, completedWorkouts: 5},
                          new Date('2026-10-19T00:10:00+09:00'));
    expect(next).toEqual({date: '2026-10-19', shownToday: 0, lastShownAt: null, completedWorkouts: 5});
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
