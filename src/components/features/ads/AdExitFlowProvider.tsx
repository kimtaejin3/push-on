import React, {createContext, useCallback, useContext, useRef, useState, type ReactNode} from 'react';
import {Platform} from 'react-native';
import {StackActions} from '@react-navigation/native';
import {
  getLatestAdConfig,
  prepareInterstitial,
  showPreparedInterstitial,
  useAds,
  waitInterstitialReady,
} from '../../../hooks/useAds';
import {navigationRef} from '../../../navigations/navigationRef';
import {isConsentFlowDone, runConsentFlow} from '../../../utils/adsConsent';
import {isProNow} from '../../../utils/purchases';
import {useStreakCelebration} from '../streak/StreakCelebrationProvider';
import {useToast} from '../../ui/feedback/ToastProvider';
import {SavingOverlay} from './SavingOverlay';
import {TrackingPrePrompt} from './TrackingPrePrompt';

export type ResultExit = {
  reps: number;
  detail?: string;
  queued?: boolean;
  test?: boolean;
  destination: 'Home' | 'Program' | 'History';
  go: () => void;
};

const ResultExitContext = createContext<((exit: ResultExit) => void) | null>(null);
const TrackingPrePromptContext = createContext<(() => Promise<void>) | null>(null);

export function useResultExit(): (exit: ResultExit) => void {
  const exit = useContext(ResultExitContext);
  if (!exit) {
    throw new Error('useResultExit는 AdExitFlowProvider 안에서 사용해야 해요.');
  }
  return exit;
}

export function useTrackingPrePrompt(): () => Promise<void> {
  const showPrePrompt = useContext(TrackingPrePromptContext);
  if (!showPrePrompt) {
    throw new Error('useTrackingPrePrompt는 AdExitFlowProvider 안에서 사용해야 해요.');
  }
  return showPrePrompt;
}

const MIN_SAVING_MS = 500;
const MAX_SAVING_MS = 1000;

export function AdExitFlowProvider({children}: {children: ReactNode}) {
  const {celebrateThen} = useStreakCelebration();
  const {show: showToast} = useToast();
  const {recordWorkout, recordTestDay} = useAds();
  const inFlight = useRef(false);
  const [saving, setSaving] = useState<ResultExit | null>(null);

  const [prePromptVisible, setPrePromptVisible] = useState(false);
  const pendingPrompt = useRef<{promise: Promise<void>; resolve: () => void} | null>(null);
  const showPrePrompt = useCallback(() => {
    if (pendingPrompt.current) {
      return pendingPrompt.current.promise;
    }
    let resolve = () => {};
    const promise = new Promise<void>(done => {
      resolve = done;
    });
    pendingPrompt.current = {promise, resolve};
    setPrePromptVisible(true);
    return promise;
  }, []);

  const finishPrePrompt = () => {
    const pending = pendingPrompt.current;
    pendingPrompt.current = null;
    pending?.resolve();
  };

  const continuePrePrompt = () => {
    setPrePromptVisible(false);
    // iOS 에서는 모달이 닫힌 뒤에 시스템 ATT 창을 띄운다
    if (Platform.OS !== 'ios') {
      finishPrePrompt();
    }
  };

  const exit = useCallback((result: ResultExit) => {
    if (inFlight.current) {
      return;
    }
    inFlight.current = true;
    let finished = false;

    const finish = () => {
      if (finished) {
        return;
      }
      finished = true;
      try {
        result.go();
        if (result.destination !== 'History') {
          showToast(`${result.reps}개 저장했어요 · 기록에서 볼 수 있어요`, {
            action: {
              label: '보기',
              onPress: () => {
                if (navigationRef.isReady()) {
                  navigationRef.dispatch(StackActions.popTo('Tabs', {screen: 'History'}));
                }
              },
            },
          });
        }
      } catch (error) {
        console.warn('[광고] 결과 이동 처리 실패:', error);
      } finally {
        inFlight.current = false;
      }
    };

    const run = async () => {
      if (finished) {
        return;
      }
      try {
        const recorded = Promise.all([
          recordWorkout(),
          ...(result.test ? [recordTestDay()] : []),
        ]);
        if (!getLatestAdConfig()?.adsEnabled || isProNow()) {
          // 광고가 꺼져 있거나 Pro 면 폰 저장소의 광고 집계를 기다리지 않는다
          recorded.catch(error => console.warn('[광고] 운동 집계 실패:', error));
          return;
        }
        await recorded;
        if (!getLatestAdConfig()?.adsEnabled) {
          return;
        }
        if (!isConsentFlowDone()) {
          await runConsentFlow(showPrePrompt);
        }
        const config = getLatestAdConfig();
        if (!config?.adsEnabled) {
          return;
        }
        prepareInterstitial(config);
        setSaving(result);
        const [ready] = await Promise.all([
          waitInterstitialReady(MAX_SAVING_MS),
          new Promise(resolve => setTimeout(resolve, MIN_SAVING_MS)),
        ]);
        setSaving(null);
        if (ready) {
          await showPreparedInterstitial(getLatestAdConfig);
        }
      } catch (error) {
        setSaving(null);
        console.warn('[광고] 결과 출구 처리 실패:', error);
      } finally {
        finish();
      }
    };

    try {
      celebrateThen(run);
    } catch (error) {
      console.warn('[광고] 결과 축하 처리 실패:', error);
      finish();
    }
  }, [celebrateThen, recordWorkout, recordTestDay, showPrePrompt, showToast]);

  return (
    <ResultExitContext.Provider value={exit}>
      <TrackingPrePromptContext.Provider value={showPrePrompt}>
        {children}
        {saving && <SavingOverlay reps={saving.reps} detail={saving.detail} queued={saving.queued} />}
        <TrackingPrePrompt
          visible={prePromptVisible}
          onContinue={continuePrePrompt}
          onDismiss={finishPrePrompt}
        />
      </TrackingPrePromptContext.Provider>
    </ResultExitContext.Provider>
  );
}
