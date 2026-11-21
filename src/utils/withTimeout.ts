export class TimeoutError extends Error {
  constructor(ms: number) {
    super(`${ms}ms 안에 끝나지 않았어요`);
    this.name = 'TimeoutError';
  }
}

/**
 * 정해진 시간 안에 끝나지 않으면 TimeoutError 로 실패시킨다.
 * 연결이 멈춘(끊긴 건 아닌) 상태에서 "저장 중…"이 영원히 이어지지 않게, 실패·다시 시도 경로로 넘기기 위함.
 * 원래 요청 자체를 취소하지는 않는다 — 뒤늦게 성공해도 같은 내용을 다시 보내는 저장에만 쓴다.
 */
export const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> =>
  new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new TimeoutError(ms)), ms);
    promise.then(
      value => {
        clearTimeout(timer);
        resolve(value);
      },
      error => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
