import {useEffect, useRef, useState} from 'react';
import {NativeModules} from 'react-native';

const {PushupManager} = NativeModules;

function usePushUpManager() {
  const [count, setCount] = useState(0);
  const [isTracking, setIsTracking] = useState(false);
  const prevCountRef = useRef(0);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isTracking) {
      PushupManager.startPushupSession();

      interval = setInterval(async () => {
        try {
          const currentCount = await PushupManager.getPushupCount();

          prevCountRef.current = currentCount;
          setCount(currentCount);
        } catch (error) {
          console.error('Failed to get pushup count:', error);
        }
      }, 500);
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
      prevCountRef.current = 0;
    }
  };

  return {
    count,
    isTracking,
    toggleTracking,
  };
}

export default usePushUpManager;
