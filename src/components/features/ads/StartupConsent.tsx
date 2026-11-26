import {useEffect, useRef} from 'react';
import {useAds} from '../../../hooks/useAds';
import {runConsentFlow} from '../../../utils/adsConsent';
import {isProNow} from '../../../utils/purchases';
import {useTrackingPrePrompt} from './AdExitFlowProvider';

// 홈이 뜬 뒤 안내 화면이 바로 겹치지 않게 잠깐 기다린다
const START_DELAY_MS = 800;

/**
 * 첫 실행에 광고 동의 흐름(iOS 추적 허용 안내 → ATT 창, 동의가 필요한 지역은 UMP)을 띄운다.
 * 광고가 첫 화면부터 나오므로 추적 데이터를 모으기 전에 물어야 한다 (App Store 심사 2.1).
 * 이미 끝냈으면 runConsentFlow 가 아무것도 하지 않는다. Pro·서버에서 광고를 끈 동안에는 묻지 않는다.
 */
export function StartupConsent(): null {
  const {serverAdsEnabled, consentDone} = useAds();
  const showPrePrompt = useTrackingPrePrompt();
  const started = useRef(false);

  useEffect(() => {
    if (!serverAdsEnabled || consentDone || started.current || isProNow()) {
      return;
    }
    const timer = setTimeout(() => {
      // 기다리는 사이 의존값이 바뀌어 정리되면 다음 렌더에서 다시 잡는다. 실제로 띄운 뒤에만 표시한다
      started.current = true;
      runConsentFlow(showPrePrompt).catch(error =>
        console.warn('[광고] 시작 동의 흐름 실패:', error),
      );
    }, START_DELAY_MS);
    return () => clearTimeout(timer);
  }, [serverAdsEnabled, consentDone, showPrePrompt]);

  return null;
}
