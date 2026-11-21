export const queryKeys = {
  // 푸쉬업 관련 쿼리 키
  pushup: {
    all: ['pushup'] as const,
    sets: (year: number, month: number, day: number) =>
      ['pushup', 'sets', year, month, day] as const,
    calendar: (year: number, month: number) =>
      ['pushup', 'calendar', year, month] as const,
    // 스트릭용. pushup 아래에 둬 운동 저장 뒤 pushup.all 무효화에 함께 묶인다.
    // 계정을 키에 넣어, 다른 계정으로 로그인했을 때 앞 계정의 스트릭이 보이거나 알림 계획에 쓰이지 않게 한다
    workoutDates: (userId: string) => ['pushup', 'workoutDates', userId] as const,
    pendingDates: (userId: string) => ['pushup', 'pendingDates', userId] as const,
    stats: {
      all: ['pushup', 'stats'] as const,
      raw: (days: number) => ['pushup', 'stats', 'raw', days] as const,
      weekly: ['pushup', 'stats', 'weekly'] as const,
      monthly: ['pushup', 'stats', 'monthly'] as const,
    },
    leaderboard: {
      all: ['pushup', 'leaderboard'] as const,
      daily: (date: string) => ['pushup', 'leaderboard', 'daily', date] as const,
      monthly: (year: number, month: number) =>
        ['pushup', 'leaderboard', 'monthly', year, month] as const,
      yearly: (year: number) =>
        ['pushup', 'leaderboard', 'yearly', year] as const,
    },
  },

  // 프로필 관련 쿼리 키
  profile: {
    all: ['profile'] as const,
    me: ['profile', 'me'] as const,
  },

  // 스트릭 알림 설정 (폰에 저장). 설정 화면이 저장 뒤 무효화하면 알림을 다시 건다
  streak: {
    all: ['streak'] as const,
    reminder: ['streak', 'reminder'] as const,
  },

  // 100개 챌린지 프로그램
  program: {
    all: ['program'] as const,
    current: ['program', 'current'] as const,
  },
} as const;
