import type {StreakState} from '../../src/domain/streak';
import {celebrationCopy, streakBanner} from '../../src/domain/streakMessages';

const base: StreakState = {current: 12, todayDone: false, longest: 12, freezes: 0, week: [],
  frozenYesterday: false, lost: null, earnedFreezeToday: false, milestoneToday: null, nextMilestone: 14};

describe('streakBanner (홈 한 줄)', () => {
  it('오늘 완료', () => {
    expect(streakBanner({...base, current: 13, todayDone: true}, 10)).toBe('13일 연속! 내일도 이어가요');
  });
  it('오늘 아직, 18시 전', () => {
    expect(streakBanner(base, 10)).toBe('오늘 운동하면 13일째예요');
  });
  it('오늘 아직, 18시 이후, 보호권 없음', () => {
    expect(streakBanner(base, 18)).toBe('오늘이 지나면 12일 스트릭이 사라져요');
  });
  it('오늘 아직, 18시 이후, 보호권 있음', () => {
    expect(streakBanner({...base, freezes: 1}, 20)).toBe('오늘 안 하면 보호권을 써요 (남은 보호권 1개)');
  });
  it('어제 보호권이 쓰였고 오늘 아직', () => {
    expect(streakBanner({...base, frozenYesterday: true}, 10)).toBe('어제는 보호권이 12일 스트릭을 지켜줬어요. 오늘은 직접 이어가요');
  });
  it('어제 끊겼고 오늘 아직', () => {
    expect(streakBanner({...base, current: 0, lost: 12}, 10)).toBe('12일 스트릭이 끊겼어요. 최고 기록 12일 · 오늘 다시 시작해요');
  });
  it('운동 기록이 한 번도 없음', () => {
    expect(streakBanner({...base, current: 0, longest: 0}, 10)).toBe('오늘 첫 운동으로 스트릭을 시작해요');
  });
  it('예전에 끊김', () => {
    expect(streakBanner({...base, current: 0, longest: 5}, 10)).toBe('오늘 운동으로 다시 시작해요 · 최고 기록 5일');
  });
});

describe('celebrationCopy (축하 화면)', () => {
  it('평범한 날', () => {
    expect(celebrationCopy({...base, current: 13, todayDone: true})).toEqual({title: '13일 연속', lines: ['내일도 이어가요']});
  });
  it('마일스톤 + 보호권을 받은 날', () => {
    expect(celebrationCopy({...base, current: 7, todayDone: true, milestoneToday: 7, earnedFreezeToday: true, freezes: 1}))
      .toEqual({title: '7일 달성!', lines: ['스트릭 보호권 1개를 받았어요', '하루 빠져도 스트릭을 지켜줘요']});
  });
  it('마일스톤만', () => {
    expect(celebrationCopy({...base, current: 30, todayDone: true, milestoneToday: 30})).toEqual({title: '30일 달성!', lines: ['내일도 이어가요']});
  });
  it('끊긴 뒤 다시 시작한 날', () => {
    expect(celebrationCopy({...base, current: 1, todayDone: true, longest: 12}))
      .toEqual({title: '다시 1일째!', lines: ['최고 기록 12일에 도전해요']});
  });
  it('처음 시작한 날', () => {
    expect(celebrationCopy({...base, current: 1, todayDone: true, longest: 1})).toEqual({title: '1일째!', lines: ['내일도 이어가요']});
  });
});
