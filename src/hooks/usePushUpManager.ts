import {useEffect, useState, useCallback} from 'react';
import {NativeModules} from 'react-native';
import useInterval from './useInterval';

const {PushupManager} = NativeModules;

const INIT_COUNT = 0;
const PUSHUP_POLLING_INTERVAL = 100;

function usePushUpManager() {
  const [count, setCount] = useState(INIT_COUNT);
  const [isTracking, setIsTracking] = useState(false);

  //TODO: useEffect도 좋지만, button 이벤트 핸들러에 묶기
  useEffect(() => {
    if (isTracking) {
      PushupManager.startPushupSession();
    } else {
      PushupManager.stopPushupSession();
    }
    return () => {
      PushupManager.stopPushupSession();
    };
  }, [isTracking]);

  const fetchPushupCount = useCallback(async () => {
    try {
      const currentCount = await PushupManager.getPushupCount();
      setCount(currentCount);
    } catch (error) {
      console.error('Failed to get pushup count:', error);
    }
  }, []);

  useInterval(fetchPushupCount, isTracking ? PUSHUP_POLLING_INTERVAL : null);

  const toggleTracking = () => {
    setIsTracking(prev => !prev);

    if (isTracking) {
      setCount(0);
    }
  };

  return {
    count,
    isTracking,
    toggleTracking,
  };
}

export default usePushUpManager;
