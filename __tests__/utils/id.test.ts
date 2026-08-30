import {generateUuid} from '../../src/utils/id';

describe('generateUuid', () => {
  it('v4 형식(8-4-4-4-12, 버전 4, variant 8..b)을 만든다', () => {
    expect(generateUuid()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });
  it('매번 다르다', () => {
    expect(new Set(Array.from({length: 20}, generateUuid)).size).toBe(20);
  });
});
