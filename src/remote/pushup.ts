import {supabase} from '../lib/supabase';

export interface PushupSetData {
  id: string;
  workout_date: string;
  set_number: number;
  reps: number;
  duration_seconds: number;
  created_at: string;
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
      .gte('workout_date', startDate.toISOString().split('T')[0])
      .lte('workout_date', endDate.toISOString().split('T')[0])
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
      const dateStr = date.toISOString().split('T')[0];
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
      .gte('workout_date', startDate.toISOString().split('T')[0])
      .lte('workout_date', endDate.toISOString().split('T')[0])
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

      const weekKey = `${weekStart.toISOString().split('T')[0]}_${
        weekEnd.toISOString().split('T')[0]
      }`;

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
          set.workout_date >= week.weekStart.toISOString().split('T')[0] &&
          set.workout_date <= week.weekEnd.toISOString().split('T')[0]
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
      user_id: user.user.id, // 사용자 ID 추가
      workout_date: new Date().toISOString().split('T')[0],
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

    console.log('푸쉬업 세션 저장 완료:', data);
  } catch (error) {
    console.error('푸쉬업 세션 저장 실패:', error);
    throw error;
  }
};
