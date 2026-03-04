import {useState, useEffect} from 'react';
import {
  NativeModules,
  NativeEventEmitter,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import {useTimer} from './useTimer';

const {PushupManager} = NativeModules;
const pushupEventEmitter = new NativeEventEmitter(PushupManager);

const INITIAL_COUNT = 0;

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


  //TODO: 훅으로 분리하기
  useEffect(() => {
    if (pushUpCount === 0) {
      return;
    }
    ReactNativeHapticFeedback.trigger('impactHeavy', {
      enableVibrateFallback: true,
      ignoreAndroidSystemSettings: false,
    });
  }, [pushUpCount]);

  useEffect(() => {
    if (!isTracking) {
      return;
    }

    const countSubscription = pushupEventEmitter.addListener(
      'onPushupCount',
      (event: {count: number}) => {
        setPushUpCount(event.count);
      },
    );

    const goingDownSubscription = pushupEventEmitter.addListener(
      'onPushupGoingDown',
      (event: {isGoingDown: boolean}) => {
        setIsGoingDown(event.isGoingDown);
      },
    );

    return () => {
      countSubscription.remove();
      goingDownSubscription.remove();
    };
  }, [isTracking]);

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
