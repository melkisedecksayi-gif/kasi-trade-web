import { useEffect, useCallback } from 'react';
import { playClickBeep } from '../utils/sound';

const useKeyboard = (handlers = {}) => {
  const handleKeyDown = useCallback((e) => {
    const key = e.key;
    const tag = e.target.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
      if (key === 'Escape') { e.target.blur(); }
      return;
    }

    const handler = handlers[key] || handlers[key.toUpperCase()];
    if (handler) {
      e.preventDefault();
      playClickBeep();
      handler(e);
    }
  }, [handlers]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
};

export default useKeyboard;
