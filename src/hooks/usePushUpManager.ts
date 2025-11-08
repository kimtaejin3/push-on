import {useState, useCallback, useEffect} from 'react';
import {NativeModules, PermissionsAndroid, Platform} from 'react-native';
import useInterval from './useInterval';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import {useTimer} from './useTimer';

const {PushupManager} = NativeModules;

const INITIAL_COUNT = 0;
const PUSHUP_POLLING_INTERVAL = 100;

function usePushUpManager() {
  const [pushUpCount, setPushUpCount] = useState(INITIAL_COUNT);
  const [isTracking, setIsTracking] = useState(false);
  const [isGoingDown, setIsGoingDown] = useState(false);

  // 타이머
  const {
    elapsedTime,
    isTimerRunning,
    handleStopTimer,
    handleResumeTimer,
    handleStartAndResetTimer,
  } = useTimer();

  useEffect(() => {
    if (pushUpCount === 0) {
      return;
    }
    ReactNativeHapticFeedback.trigger('impactHeavy', {
      enableVibrateFallback: true,
      ignoreAndroidSystemSettings: false,
    });
  }, [pushUpCount]);

  const getPushupCount = useCallback(async () => {
    try {
      const currentCount = await PushupManager.getPushupCount();
      setPushUpCount(currentCount);
    } catch (error) {
      console.error('Failed to get pushup count:', error);
    }
  }, []);

  const getIsGoingDown = useCallback(async () => {
    try {
      const isGoingDownValue = await PushupManager.getIsGoingDown();
      setIsGoingDown(isGoingDownValue);
    } catch (error) {
      console.error('Failed to get is going down:', error);
    }
  }, []);

  useInterval(getIsGoingDown, isTracking ? PUSHUP_POLLING_INTERVAL : null);
  useInterval(getPushupCount, isTracking ? PUSHUP_POLLING_INTERVAL : null);

  const requestCameraPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: '카메라 권한',
            message: '푸쉬업 카운팅을 위해 카메라 권한이 필요합니다.',
            buttonNeutral: '나중에',
            buttonNegative: '취소',
            buttonPositive: '확인',
          },
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true; // iOS는 Info.plist에서 처리
  };

  const startTracking = async () => {
    // PushupManager 모듈 확인
    if (!PushupManager) {
      console.error('❌ PushupManager 모듈이 없습니다!');
      return;
    }

    // 카메라 권한 확인
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) {
      console.error('❌ 카메라 권한이 거부되었습니다');
      return;
    }

    setIsTracking(true);
    setPushUpCount(INITIAL_COUNT);

    // 타이머 시작 및 리셋
    handleStartAndResetTimer();

    try {
      await PushupManager.startPushupSession();
    } catch (error) {
      console.error('❌ PushupManager.startPushupSession() 에러:', error);
    }
  };

  const stopTracking = () => {
    setIsTracking(false);
    handleStopTimer();
    PushupManager.stopPushupSession();
  };

  return {
    pushUpCount,
    isTracking,
    isGoingDown,
    timer: {
      elapsedTime,
      isTimerRunning,
      handleStopTimer,
      handleStartAndResetTimer,
      handleResumeTimer,
    },
    handleStartTracking: startTracking,
    handleStopTracking: stopTracking,
  };
}

export default usePushUpManager;
