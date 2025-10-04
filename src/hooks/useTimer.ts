import {useState, useCallback} from 'react';
import useInterval from './useInterval';

export const useTimer = () => {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  // 타이머 로직 (1초마다 업데이트)
  useInterval(
    () => {
      if (isRunning) {
        setElapsedTime(prev => prev + 1);
      }
    },
    isRunning ? 1000 : null,
  );

  // 시간 포맷팅 함수 (분:초)
  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
  }, []);

  // 타이머 시작
  const startTimer = useCallback(() => {
    setIsRunning(true);
  }, []);

  // 타이머 정지
  const stopTimer = useCallback(() => {
    setIsRunning(false);
  }, []);

  // 타이머 리셋
  const resetTimer = useCallback(() => {
    setElapsedTime(0);
    setIsRunning(false);
  }, []);

  // 타이머 시작 및 리셋
  const startAndResetTimer = useCallback(() => {
    setElapsedTime(0);
    setIsRunning(true);
  }, []);

  return {
    elapsedTime,
    isRunning,
    formattedTime: formatTime(elapsedTime),
    startTimer,
    stopTimer,
    resetTimer,
    startAndResetTimer,
  };
};
