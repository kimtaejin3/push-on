import {PushupSetData} from '../remote/pushup';

export type StatModeFilter = 'all' | 'challenge' | 'sets' | 'program';

export const STAT_MODE_FILTERS: {key: StatModeFilter; label: string}[] = [
  {key: 'all', label: '전체'},
  {key: 'challenge', label: '챌린지'},
  {key: 'sets', label: '세트'},
  {key: 'program', label: '100개'},
];

/** 통계용 모드 필터. program 은 프로그램 운동 + 테스트를 함께 본다. */
export const filterByMode = (sets: PushupSetData[], filter: StatModeFilter): PushupSetData[] => {
  switch (filter) {
    case 'all':
      return sets;
    case 'program':
      return sets.filter(s => s.mode === 'program' || s.mode === 'program_test');
    default:
      return sets.filter(s => s.mode === filter);
  }
};
