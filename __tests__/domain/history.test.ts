import {groupSetsByWorkout} from '../../src/domain/history';
import {PushupSetData} from '../../src/remote/pushup';

const set = (over: Partial<PushupSetData>): PushupSetData => ({
  id: 'x', workout_date: '2026-08-30', reps: 10, duration_seconds: 20, created_at: '2026-08-30T00:00:00Z',
  mode: 'challenge', workout_id: null, set_index: null, target_reps: null, ...over,
});

describe('groupSetsByWorkout', () => {
  it('챌린지/테스트는 세트 하나짜리 단독 그룹, 라벨은 챌린지/테스트', () => {
    const groups = groupSetsByWorkout([
      set({id: 'a', mode: 'challenge', reps: 15}),
      set({id: 'b', mode: 'program_test', reps: 22, created_at: '2026-08-30T01:00:00Z'}),
    ]);
    expect(groups).toHaveLength(2);
    expect(groups[0]).toMatchObject({mode: 'challenge', label: '챌린지', sets: [expect.objectContaining({id: 'a'})]});
    expect(groups[1]).toMatchObject({mode: 'program_test', label: '테스트'});
  });

  it('같은 workout_id 의 세트는 한 그룹으로 묶이고 set_index 순으로 정렬된다', () => {
    const groups = groupSetsByWorkout([
      set({id: 's2', mode: 'sets', workout_id: 'w1', set_index: 2, target_reps: 10, created_at: '2026-08-30T00:02:00Z'}),
      set({id: 's1', mode: 'sets', workout_id: 'w1', set_index: 1, target_reps: 10, created_at: '2026-08-30T00:01:00Z'}),
      set({id: 's3', mode: 'sets', workout_id: 'w1', set_index: 3, target_reps: 10, created_at: '2026-08-30T00:03:00Z'}),
    ]);
    expect(groups).toHaveLength(1);
    expect(groups[0].sets.map(s => s.id)).toEqual(['s1', 's2', 's3']);
    expect(groups[0].label).toBe('세트 · 3 × 10');
  });

  it('세트 목표가 서로 다르면 세트 수만 라벨에 쓴다', () => {
    const groups = groupSetsByWorkout([
      set({id: 'a', mode: 'sets', workout_id: 'w1', set_index: 1, target_reps: 10}),
      set({id: 'b', mode: 'sets', workout_id: 'w1', set_index: 2, target_reps: 15}),
    ]);
    expect(groups[0].label).toBe('세트 · 2세트');
  });

  it('프로그램 운동은 "100개 만들기 · N세트"', () => {
    const groups = groupSetsByWorkout([
      set({id: 'a', mode: 'program', workout_id: 'p1', set_index: 1, target_reps: 6}),
      set({id: 'b', mode: 'program', workout_id: 'p1', set_index: 2, target_reps: 6}),
    ]);
    expect(groups[0].label).toBe('100개 만들기 · 2세트');
  });

  it('그룹은 첫 세트 시각 순으로 정렬된다', () => {
    const groups = groupSetsByWorkout([
      set({id: 'late', mode: 'challenge', created_at: '2026-08-30T09:00:00Z'}),
      set({id: 'w1-2', mode: 'sets', workout_id: 'w1', set_index: 2, created_at: '2026-08-30T08:05:00Z'}),
      set({id: 'w1-1', mode: 'sets', workout_id: 'w1', set_index: 1, created_at: '2026-08-30T08:00:00Z'}),
    ]);
    expect(groups.map(g => g.key)).toEqual(['w1', 'late']);
  });
});
