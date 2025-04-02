// src/hooks/useKeyboardShortcuts.ts
import { useCallback } from 'react';

export const useKeyboardShortcuts = () => {
  const getShortcutKey = useCallback((key: string) => {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    return `${isMac ? '⌘' : 'Ctrl'} + ${key}`;
  }, []);
  
  return {
    getShortcutKey
  };
};

export default useKeyboardShortcuts;