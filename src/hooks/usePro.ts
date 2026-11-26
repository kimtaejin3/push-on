import {useEffect, useState} from 'react';
import {isProNow, subscribePro} from '../utils/purchases';

/** 지금 평생 Pro 인지. 결제·복원·계정 전환에 맞춰 다시 그린다 */
export const usePro = (): boolean => {
  const [isPro, setIsPro] = useState(isProNow);
  useEffect(() => {
    const unsubscribe = subscribePro(setIsPro);
    // 렌더와 구독 사이에 바뀌었을 수 있다
    setIsPro(isProNow());
    return unsubscribe;
  }, []);
  return isPro;
};
