import React from 'react';
import {act, create, ReactTestRenderer} from 'react-test-renderer';
import {useWorkoutCounter} from '../../src/components/features/workout/useWorkoutCounter';

let mockState: 'stopped' | 'tracking' | 'paused';
let mockAllowCamera: () => void;

jest.mock('../../src/hooks/usePushUpManager', () => ({
  __esModule: true,
  default: () => ({
    isTracking: mockState !== 'stopped',
    handleStartTracking: async () => {
      await new Promise<void>(resolve => {
        mockAllowCamera = resolve;
      });
      mockState = 'tracking';
    },
    handlePauseTracking: () => {
      mockState = 'paused';
    },
    handleStopTracking: () => {
      mockState = 'stopped';
    },
  }),
}));

describe('운동 카운터 시작', () => {
  let counter: ReturnType<typeof useWorkoutCounter>;
  let renderer: ReactTestRenderer;

  beforeEach(() => {
    mockState = 'stopped';
    function Probe() {
      counter = useWorkoutCounter();
      return null;
    }
    act(() => {
      renderer = create(<Probe />);
    });
  });

  afterEach(() => {
    act(() => renderer.unmount());
  });

  it('앱을 내린 뒤 카메라 권한이 확인되면 카운팅을 일시정지한다', async () => {
    const started = counter.start();
    counter.pause();
    mockAllowCamera();
    await started;
    expect(mockState).toBe('paused');
  });

  it('화면을 떠난 뒤 카메라 권한이 확인되면 카운팅을 중지한다', async () => {
    const started = counter.start();
    act(() => renderer.unmount());
    mockAllowCamera();
    await started;
    expect(mockState).toBe('stopped');
  });
});
