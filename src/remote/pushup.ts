import {supabase} from '../lib/supabase';
import {formatKSTDate} from '../utils/time';
import {
  addPendingSave,
  loadPendingSaves,
  removePendingSave,
} from '../utils/pendingSaves';

export type WorkoutMode = 'challenge' | 'sets' | 'program' | 'program_test';

export interface PushupSetData {
  id: string;
  workout_date: string;
  reps: number;
  duration_seconds: number;
  created_at: string;
  mode: WorkoutMode;
  workout_id: string | null;
  set_index: number | null;
  target_reps: number | null;
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
  mode?: WorkoutMode; // 기본 challenge
  workout_id?: string; // 세트/프로그램 운동 묶음
  set_index?: number; // 운동 내 세트 순번 (1부터)
  target_reps?: number; // 목표 (max 세트는 최소치)
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

export interface YearlyStatsData {
  month: string; // YYYY-MM 형식
  totalReps: number;
  totalSets: number;
  totalDuration: number;
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
 * raw 데이터를 연간 통계로 가공합니다.
 */
export const processYearlyStats = (
  rawData: PushupSetData[],
): YearlyStatsData[] => {
  const nowDate = new Date();

  // 12개월간의 월별 데이터 초기화
  const statsMap = new Map<string, YearlyStatsData>();
  for (let i = 11; i >= 0; i--) {
    const date = new Date(nowDate.getFullYear(), nowDate.getMonth() - i, 1);
    const monthStr = `${date.getFullYear()}-${(date.getMonth() + 1)
      .toString()
      .padStart(2, '0')}`;
    statsMap.set(monthStr, {
      month: monthStr,
      totalReps: 0,
      totalSets: 0,
      totalDuration: 0,
    });
  }

  // 데이터 집계
  rawData?.forEach(set => {
    // workout_date는 YYYY-MM-DD 형식이므로 YYYY-MM으로 변환
    const monthStr = set.workout_date.substring(0, 7);
    const existing = statsMap.get(monthStr);
    if (existing) {
      existing.totalReps += set.reps;
      existing.totalSets += 1;
      existing.totalDuration += set.duration_seconds;
    }
  });

  return Array.from(statsMap.values());
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
    weekStart.setDate(nowDate.getDate() - week * 8 - 7);
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

  // 데이터 집계
  rawData?.forEach(set => {
    weeklyStats.forEach(week => {
      //TODO: 이건 안전한 코드가 아닌것 같다. 문자열 비교이니까
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

export type WorkoutStamp = {workout_date: string; created_at: string};

/** stamp 가 없으면 지금 날짜·시각으로 기록한다. 보관했다 다시 보낼 때는 원래 값을 넘긴다. */
export const savePushupSession = async (
  data: SavePushupSessionData,
  stamp?: WorkoutStamp,
): Promise<void> => {
  try {
    const {data: user} = await supabase.auth.getUser();

    if (!user.user) {
      throw new Error('사용자가 로그인되지 않았습니다.');
    }

    const {error} = await supabase.from('pushup_sets').insert({
      user_id: user.user.id,
      workout_date: stamp?.workout_date ?? formatKSTDate(new Date()),
      reps: data.reps,
      duration_seconds: data.duration_seconds,
      created_at: stamp?.created_at ?? new Date().toISOString(),
      mode: data.mode ?? 'challenge',
      ...(data.workout_id !== undefined && {workout_id: data.workout_id}),
      ...(data.set_index !== undefined && {set_index: data.set_index}),
      ...(data.target_reps !== undefined && {target_reps: data.target_reps}),
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

// 보관·재전송의 계정 확인은 저장된 세션으로 한다.
// getUser 는 서버에 묻기 때문에 오프라인이면 "로그인 안 됨"이 되어, 정작 보관해야 할 때 운동을 잃는다.
const currentUserId = async (): Promise<string | null> => {
  const {
    data: {session},
  } = await supabase.auth.getSession();
  return session?.user.id ?? null;
};

/**
 * 운동 저장의 진입점. 저장에 실패하면 폰에 보관했다가 나중에 다시 보낸다
 * (네트워크가 잠깐 끊긴 날 스트릭 하루를 잃지 않도록). 로그인 안 됨 외에는 throw 하지 않는다.
 */
export const saveWorkout = async (
  data: SavePushupSessionData,
): Promise<'saved' | 'queued'> => {
  const userId = await currentUserId();
  if (!userId) {
    throw new Error('사용자가 로그인되지 않았습니다.');
  }
  // 날짜·시각을 먼저 정해 둬야 다시 보낼 때 원래 운동한 날로 기록되고, 중복 확인 키로도 쓴다
  const stamp: WorkoutStamp = {
    workout_date: formatKSTDate(new Date()),
    created_at: new Date().toISOString(),
  };
  try {
    await savePushupSession(data, stamp);
  } catch {
    try {
      await addPendingSave({userId, ...stamp, data});
    } catch (error) {
      console.error('운동 보관 실패:', error);
    }
    return 'queued';
  }
  // 저장이 됐다면 연결이 살아 있으니, 보관 중인 운동도 이참에 보낸다
  try {
    await flushPendingSaves();
  } catch (error) {
    console.warn('보관 중인 운동 재전송 실패:', error);
  }
  return 'saved';
};

// 앱 시작·포그라운드 복귀·저장 성공이 겹쳐 동시에 돌면 같은 운동을 두 번 넣을 수 있어 하나만 돌린다
let flushing: Promise<number> | null = null;

/**
 * 지금 로그인한 사용자의 보관분을 오래된 것부터 다시 보낸다. 보낸(또는 이미 있어 정리한) 개수를 돌려준다.
 * 첫 시도가 실제로는 성공했을 수 있으므로, 같은 user_id + created_at 행이 있으면 지우기만 한다.
 */
export const flushPendingSaves = (): Promise<number> => {
  if (!flushing) {
    flushing = flushOnce().finally(() => {
      flushing = null;
    });
  }
  return flushing;
};

const flushOnce = async (): Promise<number> => {
  const userId = await currentUserId();
  if (!userId) {
    return 0;
  }
  const mine = (await loadPendingSaves())
    .filter(item => item.userId === userId)
    .sort((a, b) => a.created_at.localeCompare(b.created_at));

  let done = 0;
  for (const item of mine) {
    try {
      const {data: found, error} = await supabase
        .from('pushup_sets')
        .select('id')
        .eq('user_id', userId)
        .eq('created_at', item.created_at)
        .limit(1)
        .maybeSingle();
      if (error) {
        throw error;
      }
      if (!found) {
        await savePushupSession(item.data, {
          workout_date: item.workout_date,
          created_at: item.created_at,
        });
      }
      await removePendingSave(item.created_at);
      done += 1;
    } catch {
      // 아직 연결이 안 되는 것 — 남은 것도 실패할 테니 다음 기회에 다시 보낸다
      break;
    }
  }
  return done;
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

export interface LeaderboardItem {
  user_id: string;
  nickname: string | null;
  total_reps: number;
}

// RPC 함수 반환 타입
interface RpcLeaderboardRow {
  user_id: string;
  nickname: string | null;
  total_reps: number | string; // RPC에서 BIGINT는 string으로 반환될 수 있음
}

/**
 * 일일 리더보드 조회
 * 특정 날짜의 모든 사용자들의 푸쉬업 횟수를 조회합니다.
 * RPC 함수를 사용하여 서버에서 조회하므로 효율적입니다.
 */
export const getDailyLeaderboard = async (
  date: string, // YYYY-MM-DD 형식
): Promise<LeaderboardItem[]> => {
  try {
    const {data, error} = await supabase.rpc('get_leaderboard', {
      target_date: date,
    });

    if (error) {
      throw error;
    }

    const typedData = (data || []) as RpcLeaderboardRow[];

    return typedData.map((row: RpcLeaderboardRow) => ({
      user_id: row.user_id,
      nickname: row.nickname || null,
      total_reps: Number(row.total_reps) || 0,
    }));
  } catch (error) {
    console.error('일일 리더보드 조회 실패:', error);
    throw error;
  }
};

/**
 * 월간 리더보드 조회
 * 특정 연도/월의 모든 사용자들의 푸쉬업 횟수를 집계하여 조회합니다.
 * RPC 함수를 사용하여 서버에서 집계하므로 효율적입니다.
 */
export const getMonthlyLeaderboard = async (
  year: number,
  month: number, // 1-12
): Promise<LeaderboardItem[]> => {
  try {
    const {data, error} = await supabase.rpc('get_monthly_leaderboard', {
      p_year: year,
      p_month: month,
    });

    if (error) {
      throw error;
    }

    const typedData = (data || []) as RpcLeaderboardRow[];

    return typedData.map((row: RpcLeaderboardRow) => ({
      user_id: row.user_id,
      nickname: row.nickname || null,
      total_reps: Number(row.total_reps) || 0,
    }));
  } catch (error) {
    console.error('월간 리더보드 조회 실패:', error);
    throw error;
  }
};

/**
 * 연간 리더보드 조회
 * 특정 연도의 모든 사용자들의 푸쉬업 횟수를 집계하여 조회합니다.
 * RPC 함수를 사용하여 서버에서 집계하므로 효율적입니다.
 */
export const getYearlyLeaderboard = async (
  year: number,
): Promise<LeaderboardItem[]> => {
  try {
    const {data, error} = await supabase.rpc('get_yearly_leaderboard', {
      p_year: year,
    });

    if (error) {
      throw error;
    }

    const typedData = (data || []) as RpcLeaderboardRow[];

    return typedData.map((row: RpcLeaderboardRow) => ({
      user_id: row.user_id,
      nickname: row.nickname || null,
      total_reps: Number(row.total_reps) || 0,
    }));
  } catch (error) {
    console.error('연간 리더보드 조회 실패:', error);
    throw error;
  }
};
