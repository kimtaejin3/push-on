import {useQuery} from '@tanstack/react-query';
import {useAuth} from './useAuth';
import {supabase} from '../lib/supabase';
import {formatKSTDate} from '../utils/time';

export interface PushupDayData {
  date: string; // YYYY-MM-DD 형식
  hasWorkout: boolean;
  totalReps: number;
  totalSets: number;
  totalDuration: number;
}

interface UsePushupCalendarDataProps {
  year: number;
  month: number;
}

export const usePushupCalendarData = ({
  year,
  month,
}: UsePushupCalendarDataProps) => {
  const {user} = useAuth();

  //TODO: remote 함수, queryOptions 분리
  return useQuery({
    queryKey: ['pushup', 'calendar', year, month],
    queryFn: async (): Promise<PushupDayData[]> => {
      if (!user?.id) {
        return [];
      }

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
          .eq('user_id', user.id)
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
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });
};
