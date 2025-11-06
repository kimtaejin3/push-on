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
      weekly: ['pushup', 'stats', 'weekly'] as const,
      monthly: ['pushup', 'stats', 'monthly'] as const,
    },
  },

  // 프로필 관련 쿼리 키
  profile: {
    all: ['profile'] as const,
    me: ['profile', 'me'] as const,
  },
} as const;
