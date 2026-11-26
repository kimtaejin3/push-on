import {useState, useEffect, useRef} from 'react';
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

/**
 * iOS 에서 얼굴 추적(TrueDepth) 을 못 쓰는 기기(iPad, Face ID 없는 iPhone)는 화면을 눌러(코로 터치) 센다.
 * 네이티브 상수가 없으면(옛 빌드·Android) 자동 카운트로 본다.
 */
const readFaceTrackingSupported = (): boolean => {
  if (Platform.OS !== 'ios' || !PushupManager) {
    return true;
  }
  const constants = PushupManager.getConstants?.() ?? PushupManager;
  return constants?.faceTrackingSupported !== false;
};
export const MANUAL_COUNTING = !readFaceTrackingSupported();

/** 화면을 눌러 세는 기기에서 시작 전에 보여 주는 안내 */
export const MANUAL_COUNT_HINT =
  '이 기기는 얼굴 인식 카메라가 없어 자동으로 셀 수 없어요. 시작한 뒤 내려갈 때마다 화면을 코로 눌러 세요';

function usePushUpManager() {
  const [pushUpCount, setPushUpCount] = useState(INITIAL_COUNT);
  const [isTracking, setIsTracking] = useState(false);
  const [isGoingDown, setIsGoingDown] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  // 화면을 떠날 때(언마운트) 네이티브 세션이 켜진 채 남지 않도록 추적 여부를 따로 들고 있는다
  const sessionActive = useRef(false);

  useEffect(
    () => () => {
      if (sessionActive.current) {
        sessionActive.current = false;
        PushupManager?.stopPushupSession();
      }
    },
    [],
  );

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

    sessionActive.current = true;
    setIsTracking(true);
    setIsPaused(false);
    setPushUpCount(INITIAL_COUNT);

    // 타이머 시작 및 리셋
    handleStartAndResetTimer();

    try {
      await PushupManager.startPushupSession();
    } catch (error) {
      console.error('❌ PushupManager.startPushupSession() 에러:', error);
    }
  };

  const pauseTracking = () => {
    setIsPaused(true);
    handleStopTimer();
    PushupManager.pausePushupSession();
  };

  const resumeTracking = () => {
    setIsPaused(false);
    handleResumeTimer();
    PushupManager.resumePushupSession();
  };

  /** 화면을 눌러 1개 센다 (얼굴 추적을 못 쓰는 기기에서만) */
  const countByTap = () => {
    if (!MANUAL_COUNTING || !sessionActive.current || isPaused) {
      return;
    }
    setPushUpCount(count => count + 1);
  };

  const stopTracking = () => {
    sessionActive.current = false;
    setIsTracking(false);
    setIsPaused(false);
    handleStopTimer();
    PushupManager.stopPushupSession();
  };

  return {
    pushUpCount,
    isTracking,
    isGoingDown,
    isPaused,
    timer: {
      elapsedTime,
      isTimerRunning,
    },
    handleStartTracking: startTracking,
    handlePauseTracking: pauseTracking,
    handleResumeTracking: resumeTracking,
    handleStopTracking: stopTracking,
    manualCounting: MANUAL_COUNTING,
    countByTap,
  };
}

export default usePushUpManager;
