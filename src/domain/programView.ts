/** 프로그램 화면·홈 카드가 그릴 상태. 조회 전(loading)·조회 실패(error)는 "없음(none)"과 다르다 */
export type ProgramView = 'loading' | 'error' | 'none' | 'active' | 'testDue' | 'completed';

type ProgramQuery = {
  isPending: boolean;
  isError: boolean;
  data: {status: string; test_due: boolean} | null | undefined;
};

/**
 * 조회 상태 + 프로그램 행 → 화면 상태.
 * 캐시된 행이 있으면 재조회가 실패해도 그 행을 쓴다.
 */
export const resolveProgramView = ({isPending, isError, data}: ProgramQuery): ProgramView => {
  if (data) {
    if (data.status === 'completed') {
      return 'completed';
    }
    if (data.status !== 'active') {
      return 'none';
    }
    return data.test_due ? 'testDue' : 'active';
  }
  if (isPending) {
    return 'loading';
  }
  if (isError) {
    return 'error';
  }
  return 'none';
};

/** 새 프로그램을 만들어도 되는 상태 (조회 전·실패 상태에서는 만들지 않는다 — 중복 생성 방지) */
export const canStartNewProgram = (view: ProgramView): boolean =>
  view === 'none' || view === 'completed';
