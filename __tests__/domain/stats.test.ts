import {filterByMode, STAT_MODE_FILTERS} from '../../src/domain/stats';
import {PushupSetData} from '../../src/remote/pushup';

const set = (mode: PushupSetData['mode'], id: string): PushupSetData => ({
  id, workout_date: '2026-08-30', reps: 10, duration_seconds: 20, created_at: '', mode,
  workout_id: null, set_index: null, target_reps: null,
});
const all = [set('challenge', 'c'), set('sets', 's'), set('program', 'p'), set('program_test', 't')];

describe('filterByMode', () => {
  it('필터 목록은 전체/챌린지/세트/100개', () => {
    expect(STAT_MODE_FILTERS.map(f => f.label)).toEqual(['전체', '챌린지', '세트', '100개']);
  });
  it('all 은 전부', () => {
    expect(filterByMode(all, 'all')).toHaveLength(4);
  });
  it('challenge / sets 는 해당 모드만', () => {
    expect(filterByMode(all, 'challenge').map(s => s.id)).toEqual(['c']);
    expect(filterByMode(all, 'sets').map(s => s.id)).toEqual(['s']);
  });
  it('program 은 프로그램 운동과 테스트를 함께 포함한다', () => {
    expect(filterByMode(all, 'program').map(s => s.id)).toEqual(['p', 't']);
  });
});
