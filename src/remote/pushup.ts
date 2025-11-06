import {supabase} from '../lib/supabase';
import {formatKSTDate} from '../utils/time';

export interface PushupSetData {
  id: string;
  workout_date: string;
  set_number: number;
  reps: number;
  duration_seconds: number;
  created_at: string;
}

export interface PushupDayData {
  date: string; // YYYY-MM-DD 형식
  hasWorkout: boolean;
  totalReps: number;
  totalSets: number;
  totalDuration: number;
}

export interface SavePushupSessionData {
  reps: number;
  duration_seconds: number;
  set_number: number;
}

export const getTodayPushupSets = async ({
  year,
  month,
  day,
}: {
  year: number;
  month: number;
  day: number;
}): Promise<PushupSetData[]> => {
  try {
    const {data: user} = await supabase.auth.getUser();
    if (!user.user) {
      throw new Error('사용자가 로그인되지 않았습니다.');
    }

    const {data, error} = await supabase
      .from('pushup_sets')
      .select('*')
      .eq('user_id', user.user.id) // 사용자별 필터링 추가
      .eq(
        'workout_date',
        `${year}-${month.toString().padStart(2, '0')}-${day
          .toString()
          .padStart(2, '0')}`,
      )
      .order('created_at', {ascending: true});

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('푸쉬업 세트 조회 실패:', error);
    throw error;
  }
};

export interface WeeklyStatsData {
  date: string;
  totalReps: number;
  totalSets: number;
  totalDuration: number;
}

export interface MonthlyStatsData {
  date: string;
  totalReps: number;
  totalSets: number;
  totalDuration: number;
  weekStart: Date;
  weekEnd: Date;
}

/**
 * 지정된 기간의 raw pushup 데이터를 조회합니다.
 * @param days 조회할 일수 (기본값: 30일)
 */
export const getPushupStats = async (
  days: number = 30,
): Promise<PushupSetData[]> => {
  try {
    const {data: user} = await supabase.auth.getUser();
    if (!user.user) {
      throw new Error('사용자가 로그인되지 않았습니다.');
    }

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - (days - 1));

    const {data, error} = await supabase
      .from('pushup_sets')
      .select('*')
      .eq('user_id', user.user.id)
      .gte('workout_date', formatKSTDate(startDate))
      .lte('workout_date', formatKSTDate(endDate))
      .order('workout_date', {ascending: true});

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('푸쉬업 통계 조회 실패:', error);
    throw error;
  }
};

/**
 * raw 데이터를 주간 통계로 가공합니다.
 */
export const processWeeklyStats = (
  rawData: PushupSetData[],
): WeeklyStatsData[] => {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - 6); // 지난 7일

  // 7일간의 모든 날짜를 초기화
  const statsMap = new Map<string, WeeklyStatsData>();
  for (let i = 0; i < 7; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    const dateStr = formatKSTDate(date);
    statsMap.set(dateStr, {
      date: dateStr,
      totalReps: 0,
      totalSets: 0,
      totalDuration: 0,
    });
  }

  // 데이터 집계
  rawData?.forEach(set => {
    const dateStr = set.workout_date;
    const existing = statsMap.get(dateStr);
    if (existing) {
      existing.totalReps += set.reps;
      existing.totalSets += 1;
      existing.totalDuration += set.duration_seconds;
    }
  });

  return Array.from(statsMap.values());
};

export const getWeeklyPushupStats = async (): Promise<WeeklyStatsData[]> => {
  try {
    const rawData = await getPushupStats(7);
    return processWeeklyStats(rawData);
  } catch (error) {
    console.error('주간 푸쉬업 통계 조회 실패:', error);
    throw error;
  }
};

/**
 * raw 데이터를 월간 통계(주별 그룹)로 가공합니다.
 */
export const processMonthlyStats = (
  rawData: PushupSetData[],
): MonthlyStatsData[] => {
  const nowDate = new Date();

  // 4주간의 주별 데이터 초기화
  const weeklyStats: MonthlyStatsData[] = [];
  for (let week = 0; week < 4; week++) {
    const weekStart = new Date();
    weekStart.setDate(nowDate.getDate() - week - (week + 1) * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);

    const weekKey = `${formatKSTDate(weekStart)}_${formatKSTDate(weekEnd)}`;

    weeklyStats.push({
      date: weekKey,
      weekStart,
      weekEnd,
      totalReps: 0,
      totalSets: 0,
      totalDuration: 0,
    });
  }

  console.log('weeklyStats', weeklyStats);

  // 데이터 집계
  rawData?.forEach(set => {
    weeklyStats.forEach(week => {
      if (
        set.workout_date >= formatKSTDate(week.weekStart) &&
        set.workout_date <= formatKSTDate(week.weekEnd)
      ) {
        week.totalReps += set.reps;
        week.totalSets += 1;
        week.totalDuration += set.duration_seconds;
      }
    });
  });

  return weeklyStats.reverse();
};

export const getMonthlyPushupStats = async (): Promise<MonthlyStatsData[]> => {
  try {
    const rawData = await getPushupStats(30);
    return processMonthlyStats(rawData);
  } catch (error) {
    console.error('월간 푸쉬업 통계 조회 실패:', error);
    throw error;
  }
};

export const savePushupSession = async (
  data: SavePushupSessionData,
): Promise<void> => {
  try {
    const {data: user} = await supabase.auth.getUser();

    if (!user.user) {
      throw new Error('사용자가 로그인되지 않았습니다.');
    }

    const {error} = await supabase.from('pushup_sets').insert({
      user_id: user.user.id,
      workout_date: formatKSTDate(new Date()),
      set_number: data.set_number,
      reps: data.reps,
      duration_seconds: data.duration_seconds,
      created_at: new Date().toISOString(),
    });

    if (error) {
      throw error;
    }

    // 일일 누적 집계 업데이트 (KST 기준)
    const {error: rpcError} = await supabase.rpc('add_daily_pushups', {
      p_reps: data.reps,
    });
    if (rpcError) {
      console.warn('add_daily_pushups RPC 실패:', rpcError.message);
    }
  } catch (error) {
    console.error('푸쉬업 세션 저장 실패:', error);
    throw error;
  }
};

/**
 * 푸쉬업 달력 데이터 조회 API
 * 특정 월의 모든 날짜에 대한 푸쉬업 기록을 조회합니다.
 */
export const getPushupCalendarData = async (
  userId: string,
  year: number,
  month: number,
): Promise<PushupDayData[]> => {
  try {
    // 해당 월의 첫 번째 날과 마지막 날 계산
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0); // 해당 월의 마지막 날

    const startDateStr = formatKSTDate(startDate);
    const endDateStr = formatKSTDate(endDate);

    // 해당 월의 푸쉬업 데이터 조회
    const {data, error} = await supabase
      .from('pushup_sets')
      .select('workout_date, reps, duration_seconds')
      .eq('user_id', userId)
      .gte('workout_date', startDateStr)
      .lte('workout_date', endDateStr)
      .order('workout_date', {ascending: true});

    if (error) {
      throw error;
    }

    // 날짜별로 데이터 그룹화
    const workoutMap = new Map<string, PushupDayData>();

    // 해당 월의 모든 날짜를 초기화
    for (let day = 1; day <= endDate.getDate(); day++) {
      const date = new Date(year, month - 1, day);
      const dateStr = formatKSTDate(date);
      workoutMap.set(dateStr, {
        date: formatKSTDate(date),
        hasWorkout: false,
        totalReps: 0,
        totalSets: 0,
        totalDuration: 0,
      });
    }

    // 실제 데이터로 업데이트
    data?.forEach(record => {
      const dateStr = record.workout_date;
      const existing = workoutMap.get(dateStr);

      if (existing) {
        existing.hasWorkout = true;
        existing.totalReps += record.reps;
        existing.totalSets += 1;
        existing.totalDuration += record.duration_seconds;
      }
    });

    return Array.from(workoutMap.values());
  } catch (error) {
    console.error('푸쉬업 달력 데이터 조회 실패:', error);
    throw error;
  }
};
