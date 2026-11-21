export type FontRole = 'num' | 'ko';
export type FontWeight = 500 | 600 | 700 | 800 | 900;

// 번들된 파일의 PostScript 이름(iOS)이 확장자를 뺀 파일명(Android)과 같다.
const fontFamilies: Record<FontRole, Record<FontWeight, string>> = {
  num: {
    500: 'BigShoulders-ExtraBold',
    600: 'BigShoulders-ExtraBold',
    700: 'BigShoulders-ExtraBold',
    800: 'BigShoulders-ExtraBold',
    900: 'BigShoulders-Black',
  },
  ko: {
    500: 'AstaSans-Medium',
    600: 'AstaSans-SemiBold',
    700: 'AstaSans-Bold',
    800: 'AstaSans-ExtraBold',
    900: 'AstaSans-ExtraBold',
  },
};

export const fontFamilyFor: (
  role: FontRole,
  weight: FontWeight,
  os: 'ios' | 'android',
) => string = (role, weight) => fontFamilies[role][weight];
