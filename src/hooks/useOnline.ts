import {useEffect, useState} from 'react';
import NetInfo from '@react-native-community/netinfo';

export function useOnline(): boolean | null {
  const [online, setOnline] = useState<boolean | null>(null);

  useEffect(
    () => NetInfo.addEventListener(({isConnected}) => setOnline(isConnected)),
    [],
  );

  return online;
}
