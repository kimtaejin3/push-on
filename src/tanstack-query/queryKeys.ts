export const queryKeys = {
  // 푸쉬업 관련 쿼리 키
  pushup: {
    all: ['pushup'] as const,
    sets: (year: number, month: number, day: number) =>
      ['pushup', 'sets', year, month, day] as const,
    calendar: (year: number, month: number) =>
      ['pushup', 'calendar', year, month] as const,
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
} as const;
