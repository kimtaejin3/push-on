import React from 'react';
import NetInfo, {NetInfoStateType} from '@react-native-community/netinfo';
import {act, create, type ReactTestRenderer} from 'react-test-renderer';
import {useOnline} from '../../src/hooks/useOnline';

jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(),
  NetInfoStateType: {unknown: 'unknown'},
}));

it('연결 상태가 바뀌면 반영하고 언마운트하면 구독을 해제한다', async () => {
  const unsubscribe = jest.fn();
  let emit!: (isConnected: boolean | null) => void;
  jest.mocked(NetInfo.addEventListener).mockImplementation(listener => {
    emit = isConnected =>
      listener({
        type: NetInfoStateType.unknown,
        isConnected,
        isInternetReachable: null,
        details: null,
      });
    return unsubscribe;
  });

  let online: boolean | null | undefined;
  function Probe() {
    online = useOnline();
    return null;
  }

  let renderer!: ReactTestRenderer;
  await act(async () => {
    renderer = create(<Probe />);
  });
  expect(online).toBeNull();

  await act(async () => emit(false));
  expect(online).toBe(false);

  await act(async () => emit(true));
  expect(online).toBe(true);

  await act(async () => renderer.unmount());
  expect(unsubscribe).toHaveBeenCalledTimes(1);
});
