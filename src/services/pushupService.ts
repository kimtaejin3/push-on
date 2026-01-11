import {supabase} from '../lib/supabase';

export interface PushupSetData {
  reps: number;
  duration_seconds: number;
}

export interface DailyStatsData {
  total_reps: number;
  total_sets: number;
  total_duration_seconds: number;
  date: string;
}

class PushupService {
  /**
   * 푸쉬업 세트를 데이터베이스에 저장
   */
  async savePushupSet(data: PushupSetData): Promise<void> {
    try {
      const {data: user} = await supabase.auth.getUser();
      if (!user.user) {
        throw new Error('사용자가 로그인되지 않았습니다.');
      }

      const {error} = await supabase.from('pushup_sets').insert({
        workout_date: new Date().toISOString().split('T')[0], // YYYY-MM-DD 형식
        reps: data.reps,
        duration_seconds: data.duration_seconds,
        created_at: new Date().toISOString(),
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('푸쉬업 세트 저장 실패:', error);
      throw error;
    }
  }

  /**
   * 일일 통계 업데이트 또는 생성
   */
  async updateDailyStats(data: DailyStatsData): Promise<void> {
    try {
      const {data: user} = await supabase.auth.getUser();
      if (!user.user) {
        throw new Error('사용자가 로그인되지 않았습니다.');
      }

      // 오늘 날짜의 통계가 있는지 확인
      const {data: existingStats} = await supabase
        .from('daily_statistics')
        .select('*')
        .eq('date', data.date)
        .single();

      if (existingStats) {
        // 기존 통계 업데이트
        const {error} = await supabase
          .from('daily_statistics')
          .update({
            total_reps: existingStats.total_reps + data.total_reps,
            total_sets: existingStats.total_sets + data.total_sets,
            total_duration_seconds:
              existingStats.total_duration_seconds +
              data.total_duration_seconds,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingStats.id);

        if (error) {
          throw error;
        }
      } else {
        // 새로운 통계 생성
        const {error} = await supabase.from('daily_statistics').insert({
          date: data.date,
          total_reps: data.total_reps,
          total_sets: data.total_sets,
          total_duration_seconds: data.total_duration_seconds,
          created_at: new Date().toISOString(),
        });

        if (error) {
          throw error;
        }
      }
    } catch (error) {
      console.error('일일 통계 업데이트 실패:', error);
      throw error;
    }
  }

  /**
   * 푸쉬업 세트와 일일 통계를 함께 저장
   */
  async savePushupSession(setData: PushupSetData): Promise<void> {
    try {
      // 1. 푸쉬업 세트 저장
      await this.savePushupSet(setData);

      // 2. 일일 통계 업데이트
      //   const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD 형식
      //   await this.updateDailyStats({
      //     total_reps: setData.reps,
      //     total_sets: 1,
      //     total_duration_seconds: setData.duration_seconds,
      //     date: today,
      //   });
    } catch (error) {
      console.error('푸쉬업 세션 저장 실패:', error);
      throw error;
    }
  }

  /**
   * 사용자의 오늘 푸쉬업 세트 목록 조회
   * TODO(수정): 데이터를 가져오는 부분이니 service라고 볼 수 없을 것 같다.
   */
  async getTodayPushupSets({
    year,
    month,
    day,
  }: {
    year: number;
    month: number;
    day: number;
  }): Promise<PushupSetData[]> {
    try {
      const {data: user} = await supabase.auth.getUser();
      if (!user.user) {
        throw new Error('사용자가 로그인되지 않았습니다.');
      }

      const {data, error} = await supabase
        .from('pushup_sets')
        .select('*')
        .eq('workout_date', `${year}-${month}-${day}`)
        .order('created_at', {ascending: true});

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('오늘 푸쉬업 세트 조회 실패:', error);
      throw error;
    }
  }
}

export const pushupService = new PushupService();
