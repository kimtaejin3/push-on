import {getProviderInfo} from '../../src/utils/user';

describe('getProviderInfo', () => {
  it('애플 로그인 사용자를 "Apple" 로 표시한다', () => {
    const info = getProviderInfo('apple');
    expect(info.name).toBe('Apple');
    expect(info.icon).toBe('apple');
  });

  it('기존 provider 들은 그대로 동작한다', () => {
    expect(getProviderInfo('kakao').name).toBe('카카오');
    expect(getProviderInfo('google').name).toBe('구글');
    expect(getProviderInfo('something').name).toBe('이메일');
  });
});
