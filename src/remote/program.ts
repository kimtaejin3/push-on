import {supabase} from '../lib/supabase';
import {ProgramState, Level} from '../domain/hundredPushups';

export interface CompletedDay {
  week: number;
  day: number;
  reps: number[];
  completed_at: string;
}

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

export const getActiveProgram = async (userId: string): Promise<ProgramRow | null> => {
  const {data, error} = await supabase
    .from('pushup_programs')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle();
  if (error) {
    throw error;
  }
  return data;
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
