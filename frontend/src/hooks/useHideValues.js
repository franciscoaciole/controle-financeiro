import { useSyncExternalStore } from 'react';
import { isHidden, subscribe } from '../lib/privacy';

export function useHideValues() {
  return useSyncExternalStore(subscribe, isHidden);
}
