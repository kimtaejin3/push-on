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
