import {useState, useCallback} from 'react';
import {NativeModules} from 'react-native';
import useInterval from './useInterval';

const {PushupManager} = NativeModules;

const INITIAL_COUNT = 0;
const PUSHUP_POLLING_INTERVAL = 100;

function usePushUpManager() {
  const [pushUpCount, setPushUpCount] = useState(INITIAL_COUNT);
  const [isTracking, setIsTracking] = useState(false);
  const [isGoingDown, setIsGoingDown] = useState(false);

  const getPushupCount = useCallback(async () => {
    try {
      const currentCount = await PushupManager.getPushupCount();
      setPushUpCount(currentCount);
    } catch (error) {
      console.error('Failed to get pushup count:', error);
    }
  }, []);

  const getIsGoingDown = useCallback(async () => {
    const isGoingDownValue = await PushupManager.getIsGoingDown();
    console.log('isGoingDownValue', isGoingDownValue);
    setIsGoingDown(isGoingDownValue);
  }, []);

  useInterval(getPushupCount, isTracking ? PUSHUP_POLLING_INTERVAL : null);
  useInterval(getIsGoingDown, isTracking ? 10 : null);

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
    isGoingDown,
    startTracking,
    stopTracking,
  };
}

export default usePushUpManager;
