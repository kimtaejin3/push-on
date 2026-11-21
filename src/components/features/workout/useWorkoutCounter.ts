import {useEffect, useRef} from 'react';
import usePushUpManager from '../../../hooks/usePushUpManager';

export function useWorkoutCounter() {
  const manager = usePushUpManager();
  const {
    handleStartTracking,
    handlePauseTracking,
    handleResumeTracking,
    handleStopTracking,
  } = manager;
  const command = useRef<'stopped' | 'tracking' | 'paused'>('stopped');
  const starting = useRef(false);

  useEffect(
    () => () => {
      command.current = 'stopped';
    },
    [],
  );

  const settleStart = () => {
    starting.current = false;
    // 권한 확인 중에 화면을 나갔거나 앱을 내렸을 수 있다.
    if (command.current === 'stopped') {
      handleStopTracking();
    } else if (command.current === 'paused') {
      handlePauseTracking();
    }
  };

  const start = async () => {
    command.current = 'tracking';
    if (starting.current) {
      return;
    }
    starting.current = true;
    try {
      await handleStartTracking();
    } finally {
      settleStart();
    }
  };

  const pause = () => {
    if (command.current === 'tracking') {
      command.current = 'paused';
      if (manager.isTracking) {
        handlePauseTracking();
      }
    }
  };

  return {
    ...manager,
    start,
    pause,
    resume: () => {
      if (!manager.isTracking) {
        return start();
      }
      command.current = 'tracking';
      handleResumeTracking();
    },
    stop: () => {
      command.current = 'stopped';
      if (manager.isTracking) {
        handleStopTracking();
      }
    },
  };
}
