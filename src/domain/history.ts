import {PushupSetData, WorkoutMode} from '../remote/pushup';

export type WorkoutGroup = {
  key: string; // workout_id 또는 단독 세트의 id
  mode: WorkoutMode;
  label: string;
  sets: PushupSetData[];
};

const modeLabel = (mode: WorkoutMode, sets: PushupSetData[]): string => {
  switch (mode) {
    case 'challenge':
      return '챌린지';
    case 'program_test':
      return '테스트';
    case 'program':
      return `100개 챌린지 · ${sets.length}세트`;
    case 'sets': {
      const targets = new Set(sets.map(s => s.target_reps));
      const [only] = [...targets];
      return targets.size === 1 && only
        ? `세트 · ${sets.length} × ${only}`
        : `세트 · ${sets.length}세트`;
    }
    default:
      return '푸쉬업';
  }
};

/**
 * 하루치 세트를 운동 단위로 묶는다.
 * 같은 workout_id 는 한 그룹(set_index 순), 나머지는 단독 그룹. 그룹은 첫 세트 시각 순.
 */
export const groupSetsByWorkout = (sets: PushupSetData[]): WorkoutGroup[] => {
  const byKey = new Map<string, PushupSetData[]>();
  for (const s of sets) {
    const key = s.workout_id ?? s.id;
    byKey.set(key, [...(byKey.get(key) ?? []), s]);
  }
  return [...byKey.entries()]
    .map(([key, group]) => {
      const sorted = [...group].sort((a, b) =>
        a.set_index !== null && b.set_index !== null
          ? a.set_index - b.set_index
          : a.created_at.localeCompare(b.created_at),
      );
      const mode = sorted[0].mode ?? 'challenge';
      return {key, mode, label: modeLabel(mode, sorted), sets: sorted};
    })
    .sort((a, b) => a.sets[0].created_at.localeCompare(b.sets[0].created_at));
};
