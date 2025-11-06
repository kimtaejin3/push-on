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

export const getWeeklyPushupStats = async (): Promise<WeeklyStatsData[]> => {
  try {
    const {data: user} = await supabase.auth.getUser();
    if (!user.user) {
      throw new Error('사용자가 로그인되지 않았습니다.');
    }

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 6); // 지난 7일

    const {data, error} = await supabase
      .from('pushup_sets')
      .select('*')
      .eq('user_id', user.user.id) // 사용자별 필터링 추가
      .gte('workout_date', formatKSTDate(startDate))
      .lte('workout_date', formatKSTDate(endDate))
      .order('workout_date', {ascending: true});

    if (error) {
      throw error;
    }

    // 날짜별로 그룹화하여 통계 계산
    const statsMap = new Map<string, WeeklyStatsData>();
    // 7일간의 모든 날짜를 초기화
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
    data?.forEach(set => {
      const dateStr = set.workout_date;
      const existing = statsMap.get(dateStr);
      if (existing) {
        existing.totalReps += set.reps;
        existing.totalSets += 1;
        existing.totalDuration += set.duration_seconds;
      }
    });

    return Array.from(statsMap.values());
  } catch (error) {
    console.error('주간 푸쉬업 통계 조회 실패:', error);
    throw error;
  }
};

export const getMonthlyPushupStats = async (): Promise<MonthlyStatsData[]> => {
  try {
    const {data: user} = await supabase.auth.getUser();
    if (!user.user) {
      throw new Error('사용자가 로그인되지 않았습니다.');
    }

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 29); // 지난 30일

    //TODO: 월간 통계 조회 시 오늘 날짜 이전 30일 데이터부터 조회
    const {data, error} = await supabase
      .from('pushup_sets')
      .select('*')
      .eq('user_id', user.user.id) // 사용자별 필터링 추가
      .gte('workout_date', formatKSTDate(startDate))
      .lte('workout_date', formatKSTDate(endDate))
      .order('workout_date', {ascending: true});

    if (error) {
      throw error;
    }

    if (!data) {
      return [];
    }

    // 주별로 그룹화하여 통계 계산
    const weeklyStats: MonthlyStatsData[] = [];

    // 4주간의 주별 데이터 초기화
    for (let week = 0; week < 4; week++) {
      const weekEnd = new Date();
      weekEnd.setDate(endDate.getDate() - week * 7);
      const weekStart = new Date();
      weekStart.setDate(weekEnd.getDate() - 6);

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

    data.forEach(set => {
      weeklyStats.forEach(week => {
        //TODO: 조건 로직 간소화가 가능할 것 같다.
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
