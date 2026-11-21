import {suggestFreeSets} from '../../src/domain/freeSetSuggestion';

describe('suggestFreeSets', () => {
  it('최고 기록의 60%를 반올림해 3세트와 60초 휴식을 추천한다', () => {
    expect(suggestFreeSets(41)).toEqual({sets: 3, reps: 25, restSeconds: 60});
  });

  it('최고 기록이 1개면 1개를 추천한다', () => {
    expect(suggestFreeSets(1)?.reps).toBe(1);
  });

  it('최고 기록이 없으면 추천하지 않는다', () => {
    expect(suggestFreeSets(null)).toBeNull();
  });
});
