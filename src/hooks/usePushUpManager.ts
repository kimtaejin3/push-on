import {useState, useCallback} from 'react';
import {NativeModules} from 'react-native';
import useInterval from './useInterval';

const {PushupManager} = NativeModules;

const INITIAL_COUNT = 0;
const PUSHUP_POLLING_INTERVAL = 100;

function usePushUpManager() {
  const [pushUpCount, setPushUpCount] = useState(INITIAL_COUNT);
  const [isTracking, setIsTracking] = useState(false);

  const getPushupCount = useCallback(async () => {
    try {
      const currentCount = await PushupManager.getPushupCount();
      setPushUpCount(currentCount);
    } catch (error) {
      console.error('Failed to get pushup count:', error);
    }
  }, []);

  useInterval(getPushupCount, isTracking ? PUSHUP_POLLING_INTERVAL : null);

  const startTracking = () => {
    setIsTracking(true);
    setPushUpCount(INITIAL_COUNT);
    PushupManager.startPushupSession();
  };

  const stopTracking = () => {
    setIsTracking(false);
    PushupManager.stopPushupSession();
  };

  return {
    pushUpCount,
    isTracking,
    startTracking,
    stopTracking,
  };
}

export default usePushUpManager;
