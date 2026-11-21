import {fontFamilyFor} from '../../src/theme/fonts';

describe('fontFamilyFor', () => {
  it('굵기별 파일을 Android 는 파일 이름(확장자 제외)으로 찾는다', () => {
    expect(fontFamilyFor('num', 900, 'android')).toBe('BigShoulders-Black');
    expect(fontFamilyFor('ko', 700, 'android')).toBe('AstaSans-Bold');
  });
  it('iOS 는 폰트의 PostScript 이름을 쓴다 (설치한 파일에서 확인한 값으로)', () => {
    expect(typeof fontFamilyFor('ko', 500, 'ios')).toBe('string');
    expect(fontFamilyFor('ko', 500, 'ios')).not.toBe('');
  });
  it('없는 조합은 가장 가까운 굵기로 (숫자 500 → 800)', () => {
    expect(fontFamilyFor('num', 500, 'android')).toBe('BigShoulders-ExtraBold');
  });
});
