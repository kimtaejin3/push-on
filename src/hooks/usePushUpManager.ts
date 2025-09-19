import {useEffect, useState} from 'react';
import {NativeModules} from 'react-native';

const {PushupManager} = NativeModules;

const INIT_COUNT = 0;
const PUSHUP_TRACKING_INTERVAL = 100;

function usePushUpManager() {
  const [count, setCount] = useState(INIT_COUNT);
  const [isTracking, setIsTracking] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isTracking) {
      PushupManager.startPushupSession();

      interval = setInterval(async () => {
        try {
          const currentCount = await PushupManager.getPushupCount();

          setCount(currentCount);
        } catch (error) {
          console.error('Failed to get pushup count:', error);
        }
      }, PUSHUP_TRACKING_INTERVAL);
    } else if (interval) {
      clearInterval(interval);
      PushupManager.stopPushupSession();
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
      PushupManager.stopPushupSession();
    };
  }, [isTracking]);

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
