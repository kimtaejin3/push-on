/** 보호권은 최대 이만큼 쌓인다 */
export const MAX_FREEZES = 2;
/** 이만큼 이어갈 때마다 보호권 1개 */
export const FREEZE_EVERY = 7;
export const MILESTONES = [3, 7, 14, 30, 50, 100, 200, 365];

export type DayMark = 'done' | 'frozen' | 'missed' | 'today' | 'future';

export type StreakState = {
  current: number; // 오늘 했으면 오늘 포함
  todayDone: boolean;
  longest: number;
  freezes: number; // 0..2
  week: {date: string; mark: DayMark}[]; // 오늘이 속한 주의 월~일 7칸
  frozenYesterday: boolean; // 어제 보호권이 쓰였다
  lost: number | null; // 어제 끊겼다면 끊기기 전 스트릭, 아니면 null
  earnedFreezeToday: boolean;
  milestoneToday: number | null;
  nextMilestone: number | null;
};

// 날짜는 문자열로만 다루고 계산은 UTC 로 한다 — 기기 시간대·서머타임에 따라 하루가 밀리지 않게
const toUtc = (date: string): number => {
  const [y, m, d] = date.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
};
const fromUtc = (ms: number): string => new Date(ms).toISOString().slice(0, 10);

/** 'YYYY-MM-DD' 에 n 일을 더한다 */
export const addDays = (date: string, n: number): string => fromUtc(toUtc(date) + n * 86400000);

/** 그 날짜가 속한 주의 월요일 */
const mondayOf = (date: string): string => {
  const dow = new Date(toUtc(date)).getUTCDay(); // 0=일
  return addDays(date, -((dow + 6) % 7));
};

/**
 * 운동한 날짜 목록과 오늘 날짜만으로 스트릭을 계산한다 (스펙 3.2).
 * 첫 운동일부터 어제까지 하루씩 따라가며 한 날은 +1, 안 한 날은 보호권을 쓰거나 0 으로 돌린 뒤 오늘을 처리한다.
 * 오늘보다 뒤의 날짜와 중복은 무시한다.
 */
export const computeStreak = (dates: string[], today: string): StreakState => {
  const done = new Set(dates.filter(d => d <= today));
  const frozen = new Set<string>();
  let current = 0;
  let longest = 0;
  let freezes = 0;
  let lostOn: string | null = null; // 마지막으로 끊긴 날
  let lostLength = 0;

  // 한 날의 처리. 보호권을 받았으면 true
  const workout = (): boolean => {
    current += 1;
    longest = Math.max(longest, current);
    if (current % FREEZE_EVERY === 0 && freezes < MAX_FREEZES) {
      freezes += 1;
      return true;
    }
    return false;
  };

  const first = [...done].sort()[0];
  if (first !== undefined) {
    for (let day = first; day < today; day = addDays(day, 1)) {
      if (done.has(day)) {
        workout();
      } else if (current >= 1) {
        if (freezes > 0) {
          freezes -= 1;
          frozen.add(day);
        } else {
          lostOn = day;
          lostLength = current;
          current = 0;
        }
      }
    }
  }

  const yesterday = addDays(today, -1);
  const todayDone = done.has(today);
  const earnedFreezeToday = todayDone ? workout() : false;

  const monday = mondayOf(today);
  const week = Array.from({length: 7}, (_, i) => {
    const date = addDays(monday, i);
    let mark: DayMark;
    if (date > today) {
      mark = 'future';
    } else if (date === today) {
      mark = todayDone ? 'done' : 'today';
    } else {
      mark = done.has(date) ? 'done' : frozen.has(date) ? 'frozen' : 'missed';
    }
    return {date, mark};
  });

  return {
    current,
    todayDone,
    longest,
    freezes,
    week,
    frozenYesterday: frozen.has(yesterday),
    lost: lostOn === yesterday && !todayDone ? lostLength : null,
    earnedFreezeToday,
    milestoneToday: todayDone && MILESTONES.includes(current) ? current : null,
    nextMilestone: MILESTONES.find(m => m > current) ?? null,
  };
};
