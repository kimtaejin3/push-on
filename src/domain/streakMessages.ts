import type {StreakState} from './streak';

/** 이 시각부터는 "오늘 안 하면 잃는다"를 앞세운다 */
const EVENING_HOUR = 18;

/**
 * 홈 제목 아래 한 줄 (스펙 4.1).
 * 우선순위: 오늘 완료 → 어제 끊김 → 어제 보호권 사용 → 지킬 스트릭 있음 → 기록 없음/예전에 끊김.
 * 끊겼을 때도 꾸짖지 않고 사실·최고 기록·다시 시작만 말한다.
 */
export const streakBanner = (state: StreakState, hour: number): string => {
  const {current, todayDone, longest, freezes, frozenYesterday, lost} = state;
  if (todayDone) {
    return `${current}일 연속! 내일도 이어가요`;
  }
  if (lost !== null) {
    return `${lost}일 스트릭이 끊겼어요. 최고 기록 ${longest}일 · 오늘 다시 시작해요`;
  }
  if (frozenYesterday) {
    return `어제는 보호권이 ${current}일 스트릭을 지켜줬어요. 오늘은 직접 이어가요`;
  }
  if (current >= 1) {
    if (hour < EVENING_HOUR) {
      return `오늘 운동하면 ${current + 1}일째예요`;
    }
    return freezes > 0
      ? `오늘 안 하면 보호권을 써요 (남은 보호권 ${freezes}개)`
      : `오늘이 지나면 ${current}일 스트릭이 사라져요`;
  }
  return longest === 0
    ? '오늘 첫 운동으로 스트릭을 시작해요'
    : `오늘 운동으로 다시 시작해요 · 최고 기록 ${longest}일`;
};

/** 그날 첫 운동을 마친 뒤 축하 화면 문구 (스펙 4.2). state 는 오늘 완료 상태 */
export const celebrationCopy = (state: StreakState): {title: string; lines: string[]} => {
  const {current, longest, milestoneToday, earnedFreezeToday} = state;
  // 보호권은 한 번에 1개씩만 생긴다
  const lines = earnedFreezeToday
    ? ['스트릭 보호권 1개를 받았어요', '하루 빠져도 스트릭을 지켜줘요']
    : ['내일도 이어가요'];
  if (milestoneToday !== null) {
    return {title: `${milestoneToday}일 달성!`, lines};
  }
  if (current === 1) {
    // 최고 기록이 더 길면 예전 스트릭이 끊긴 뒤 다시 시작한 날이다
    return longest > 1
      ? {title: '다시 1일째!', lines: [`최고 기록 ${longest}일에 도전해요`]}
      : {title: '1일째!', lines};
  }
  return {title: `${current}일 연속`, lines};
};
