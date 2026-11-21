import type {PushupSetData} from '../../../remote/pushup';
import type {PendingSave} from '../../../utils/pendingSaves';

export function mergePendingSets(
  saved: PushupSetData[],
  pending: PendingSave[],
  start: string,
  end: string,
) {
  const savedTimes = new Set(saved.map(set => Date.parse(set.created_at)));
  const unsent = pending
    .filter(
      item =>
        item.workout_date >= start &&
        item.workout_date <= end &&
        !savedTimes.has(Date.parse(item.created_at)),
    )
    .map<PushupSetData>(({data, created_at, workout_date}) => ({
      id: `pending-${created_at}`,
      workout_date,
      created_at,
      reps: data.reps,
      duration_seconds: data.duration_seconds,
      mode: data.mode ?? 'challenge',
      workout_id: data.workout_id ?? null,
      set_index: data.set_index ?? null,
      target_reps: data.target_reps ?? null,
    }));
  return {sets: [...saved, ...unsent], unsent};
}
