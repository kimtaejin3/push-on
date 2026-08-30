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

describe('validateNickname', () => {
  it.each([
    ['', '닉네임을 입력해주세요.'],
    ['a', '닉네임은 2글자 이상 입력해주세요.'],
    ['12345678901', '닉네임은 10글자 이하로 입력해주세요.'],
  ])('"%s" 는 오류 메시지 "%s" 를 돌려준다', (input, message) => {
    expect(validateNickname(input)).toBe(message);
  });

  it('2~10글자면 null 을 돌려준다', () => {
    expect(validateNickname('푸쉬업사랑')).toBeNull();
    expect(validateNickname('user-23923djs'.slice(0, 10))).toBeNull();
  });

  it('앞뒤 공백은 무시하고 검사한다', () => {
    expect(validateNickname('  a  ')).toBe('닉네임은 2글자 이상 입력해주세요.');
  });
});
