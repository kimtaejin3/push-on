import {supabase} from '../lib/supabase';

export interface PushupSetData {
  id: string;
  workout_date: string;
  set_number: number;
  reps: number;
  duration_seconds: number;
  created_at: string;
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
    const {data, error} = await supabase
      .from('pushup_sets')
      .select('*')
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
}

export const getWeeklyPushupStats = async (): Promise<WeeklyStatsData[]> => {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 6); // 지난 7일

    const {data, error} = await supabase
      .from('pushup_sets')
      .select('*')
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
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 29); // 지난 30일

    const {data, error} = await supabase
      .from('pushup_sets')
      .select('*')
      .gte('workout_date', startDate.toISOString().split('T')[0])
      .lte('workout_date', endDate.toISOString().split('T')[0])
      .order('workout_date', {ascending: true});

    if (error) {
      throw error;
    }

    // 주별로 그룹화하여 통계 계산
    const weeklyStats: MonthlyStatsData[] = [];

    // 4주간의 주별 데이터 초기화
    for (let week = 0; week < 4; week++) {
      const weekStart = new Date(startDate);
      weekStart.setDate(startDate.getDate() + week * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);

      const weekKey = `${weekStart.toISOString().split('T')[0]}_${
        weekEnd.toISOString().split('T')[0]
      }`;

      weeklyStats.push({
        date: weekKey,
        totalReps: 0,
        totalSets: 0,
        totalDuration: 0,
      });
    }

    // 데이터를 주별로 집계
    data?.forEach(set => {
      const setDate = new Date(set.workout_date);

      // 해당 날짜가 어느 주에 속하는지 계산
      const daysDiff = Math.floor(
        (setDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
      );
      const weekIndex = Math.floor(daysDiff / 7);

      if (weekIndex >= 0 && weekIndex < 4) {
        weeklyStats[weekIndex].totalReps += set.reps;
        weeklyStats[weekIndex].totalSets += 1;
        weeklyStats[weekIndex].totalDuration += set.duration_seconds;
      }
    });

    return weeklyStats;
  } catch (error) {
    console.error('월간 푸쉬업 통계 조회 실패:', error);
    throw error;
  }
};
