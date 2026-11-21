import {supabase} from '../lib/supabase';
import {ProgramState, ProgramRecord, Level} from '../domain/hundredPushups';

/** completed_days 의 한 건: 시도(통과/실패) 또는 이동 표시 */
export type CompletedDay = ProgramRecord;

export interface ProgramRow {
  id: string;
  user_id: string;
  status: 'active' | 'completed' | 'abandoned';
  week: number;
  day: number;
  level: Level;
  last_test_reps: number;
  test_due: boolean;
  completed_days: CompletedDay[];
  created_at: string;
  updated_at: string;
}

const toColumns = (state: ProgramState) => ({
  week: state.week,
  day: state.day,
  level: state.level,
  last_test_reps: state.lastTestReps,
  test_due: state.testDue,
  status: state.status,
});

export const toProgramState = (row: ProgramRow): ProgramState => ({
  week: row.week,
  day: row.day,
  level: row.level,
  lastTestReps: row.last_test_reps,
  testDue: row.test_due,
  status: row.status === 'completed' ? 'completed' : 'active',
});

/**
 * 가장 최근에 만든 프로그램 한 건. active 면 진행 중, completed 면 완료 화면을 보여준다.
 * 최신이 그만둔(abandoned) 것이면 프로그램이 없는 것으로 본다.
 */
export const getCurrentProgram = async (userId: string): Promise<ProgramRow | null> => {
  const {data, error} = await supabase
    .from('pushup_programs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', {ascending: false})
    .limit(1)
    .maybeSingle();
  if (error) {
    throw error;
  }
  return data && data.status !== 'abandoned' ? data : null;
};

export const createProgram = async (userId: string, state: ProgramState): Promise<ProgramRow> => {
  const {data, error} = await supabase
    .from('pushup_programs')
    .insert({user_id: userId, ...toColumns(state)})
    .select()
    .single();
  if (error) {
    throw error;
  }
  return data;
};

/**
 * 진행 상태 저장. completedDay 를 주면 기존 completed_days(existing) 뒤에 덧붙인다.
 */
export const updateProgram = async (
  id: string,
  state: ProgramState,
  completedDay?: CompletedDay,
  existing: CompletedDay[] = [],
): Promise<ProgramRow> => {
  const patch = {
    ...toColumns(state),
    updated_at: new Date().toISOString(),
    ...(completedDay && {completed_days: [...existing, completedDay]}),
  };
  const {data, error} = await supabase
    .from('pushup_programs')
    .update(patch)
    .eq('id', id)
    .select()
    .single();
  if (error) {
    throw error;
  }
  return data;
};

export const abandonProgram = async (id: string): Promise<void> => {
  const {error} = await supabase
    .from('pushup_programs')
    .update({status: 'abandoned', updated_at: new Date().toISOString()})
    .eq('id', id);
  if (error) {
    throw error;
  }
};
