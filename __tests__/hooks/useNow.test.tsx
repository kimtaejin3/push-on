import React from 'react';
import {AppState, AppStateStatus} from 'react-native';
import {act, create, ReactTestRenderer} from 'react-test-renderer';
import {useNow} from '../../src/hooks/useNow';

type Result = ReturnType<typeof useNow>;

describe('useNow', () => {
  let emit: (state: AppStateStatus) => void;
  let remove: jest.Mock;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 10, 21, 20, 0));
    remove = jest.fn();
    jest.spyOn(AppState, 'addEventListener').mockImplementation((_type, handler) => {
      emit = handler as (state: AppStateStatus) => void;
      return {remove} as unknown as ReturnType<typeof AppState.addEventListener>;
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  function renderHook() {
    const result: {current?: Result} = {};
    function Probe() {
      result.current = useNow();
      return null;
    }
    let renderer!: ReactTestRenderer;
    act(() => {
      renderer = create(<Probe />);
    });
    return {result: result as {current: Result}, renderer};
  }

  it('처음 그릴 때 지금 시각을 준다', () => {
    const {result} = renderHook();
    expect(result.current.now).toBeInstanceOf(Date);
    expect(result.current.now.getDate()).toBe(21);
  });

  it('앱이 다시 포그라운드가 되면 지금 시각으로 갱신한다', () => {
    const {result} = renderHook();
    jest.setSystemTime(new Date(2026, 10, 22, 19, 0));
    act(() => emit('active'));
    expect(result.current.now.getDate()).toBe(22);
  });

  it('백그라운드로 갈 때는 갱신하지 않는다', () => {
    const {result} = renderHook();
    jest.setSystemTime(new Date(2026, 10, 22, 19, 0));
    act(() => emit('background'));
    expect(result.current.now.getDate()).toBe(21);
  });

  it('refresh() 로 직접 갱신할 수 있다', () => {
    const {result} = renderHook();
    jest.setSystemTime(new Date(2026, 10, 22, 19, 0));
    act(() => result.current.refresh());
    expect(result.current.now.getDate()).toBe(22);
  });

  it('화면이 사라지면 AppState 구독을 해제한다', () => {
    const {renderer} = renderHook();
    expect(remove).not.toHaveBeenCalled();
    act(() => renderer.unmount());
    expect(remove).toHaveBeenCalledTimes(1);
  });
});
