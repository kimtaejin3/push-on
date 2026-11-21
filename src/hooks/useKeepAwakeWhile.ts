import {useEffect} from 'react';
import {useIsFocused} from '@react-navigation/native';
import {
  activateKeepAwake,
  deactivateKeepAwake,
} from '@sayem314/react-native-keep-awake';

export function useKeepAwakeWhile(enabled: boolean) {
  const focused = useIsFocused();
  useEffect(() => {
    if (enabled && focused) {
      activateKeepAwake();
      return deactivateKeepAwake;
    }
  }, [enabled, focused]);
}
