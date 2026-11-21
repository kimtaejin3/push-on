import {withTimeout, TimeoutError} from '../../src/utils/withTimeout';

describe('withTimeout', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('시간 안에 끝나면 결과를 그대로 돌려준다', async () => {
    await expect(withTimeout(Promise.resolve('ok'), 1000)).resolves.toBe('ok');
  });

  it('원래 오류는 그대로 전달한다', async () => {
    await expect(withTimeout(Promise.reject(new Error('boom')), 1000)).rejects.toThrow('boom');
  });

  it('시간 안에 끝나지 않으면 TimeoutError 로 실패한다 (멈춘 요청이 영원히 대기하지 않게)', async () => {
    const never = new Promise<string>(() => {});
    const result = withTimeout(never, 15000);
    jest.advanceTimersByTime(15000);
    await expect(result).rejects.toBeInstanceOf(TimeoutError);
  });
});
