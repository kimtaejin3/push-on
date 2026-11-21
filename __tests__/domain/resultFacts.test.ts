import {resultFacts} from '../../src/domain/resultFacts';

it('디자인 예시 그대로', () => {
  expect(
    resultFacts({
      results: [14, 16, 12, 12, 10],
      targets: [14, 16, 12, 12, 8],
      lastIsMax: true,
      previousTotal: 58,
      previousBestSet: 15,
    }),
  ).toEqual({
    total: 64,
    target: 62,
    diffFromTarget: 2,
    bestSetIndex: 1,
    bestSetReps: 16,
    diffFromPrevious: 6,
    lastSetExtra: 2,
    isPersonalBestSet: true,
  });
});

it('첫 기록이면 지난번 대비와 개인 최고는 없다', () => {
  expect(
    resultFacts({
      results: [12],
      targets: null,
      lastIsMax: false,
      previousTotal: null,
      previousBestSet: null,
    }),
  ).toMatchObject({
    total: 12,
    target: null,
    diffFromTarget: null,
    diffFromPrevious: null,
    lastSetExtra: null,
    isPersonalBestSet: false,
  });
});

it('최고 세트가 여럿이면 첫 번째, 같으면 개인 최고 아님', () => {
  expect(
    resultFacts({
      results: [10, 10],
      targets: [10, 10],
      lastIsMax: false,
      previousTotal: 20,
      previousBestSet: 10,
    }),
  ).toMatchObject({
    bestSetIndex: 0,
    isPersonalBestSet: false,
    diffFromPrevious: 0,
    lastSetExtra: null,
  });
});

it('최대 세트 전에 중단하면 마지막 세트 대비는 없다', () => {
  expect(
    resultFacts({
      results: [12],
      targets: [12, 8],
      lastIsMax: true,
      previousTotal: 0,
      previousBestSet: 0,
    }),
  ).toMatchObject({
    diffFromTarget: -8,
    diffFromPrevious: 12,
    lastSetExtra: null,
    isPersonalBestSet: true,
  });
});

it('완료한 세트가 없으면 최고 세트의 인덱스는 -1이다', () => {
  expect(
    resultFacts({
      results: [],
      targets: [8],
      lastIsMax: true,
      previousTotal: null,
      previousBestSet: 0,
    }),
  ).toMatchObject({
    total: 0,
    bestSetIndex: -1,
    bestSetReps: 0,
    lastSetExtra: null,
    isPersonalBestSet: false,
  });
});
