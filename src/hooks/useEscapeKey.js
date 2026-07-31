import { useEffect } from 'react';

const useEscapeKey = (onEscape) => {
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onEscape();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onEscape]);
};

export default useEscapeKey;
