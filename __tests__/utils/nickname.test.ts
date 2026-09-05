import {generateRandomNickname, validateNickname} from '../../src/utils/nickname';

describe('generateRandomNickname', () => {
  it('"user-" 뒤에 영소문자/숫자 8자를 붙인 형식을 만든다', () => {
    const nickname = generateRandomNickname();
    expect(nickname).toMatch(/^user-[a-z0-9]{8}$/);
  });

  it('호출할 때마다 다른 값을 만든다', () => {
    const samples = new Set(Array.from({length: 50}, () => generateRandomNickname()));
    expect(samples.size).toBe(50);
  });
});

describe('generateRandomNickname + validateNickname', () => {
  it('자동 생성 닉네임은 항상 입력 규칙을 통과한다', () => {
    for (let i = 0; i < 20; i++) {
      const nickname = generateRandomNickname();
      expect(validateNickname(nickname)).toBeNull();
    }
  });
});

describe('validateNickname', () => {
  it.each([
    ['', '닉네임을 입력해주세요.'],
    ['a', '닉네임은 2글자 이상 입력해주세요.'],
    ['12345678901234567', '닉네임은 16글자 이하로 입력해주세요.'],
  ])('"%s" 는 오류 메시지 "%s" 를 돌려준다', (input, message) => {
    expect(validateNickname(input)).toBe(message);
  });

  it('2~16글자면 null 을 돌려준다', () => {
    expect(validateNickname('푸쉬업사랑')).toBeNull();
    expect(validateNickname('user-23923djs')).toBeNull();
  });

  it('앞뒤 공백은 무시하고 검사한다', () => {
    expect(validateNickname('  a  ')).toBe('닉네임은 2글자 이상 입력해주세요.');
  });
});
