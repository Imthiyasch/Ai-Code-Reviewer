import { useState, useCallback, useRef } from 'react';

export function useToast() {
  const [toasts, setToasts] = useState<{ id: string; type: 'success'|'error'|'info'; message: string }[]>([]);
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const addToast = useCallback((type: 'success'|'error'|'info', message: string) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { id, type, message }]);
    timers.current[id] = setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
      delete timers.current[id];
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
    clearTimeout(timers.current[id]);
    delete timers.current[id];
  }, []);

  return { toasts, addToast, removeToast,
    success: (m: string) => addToast('success', m),
    error: (m: string) => addToast('error', m),
    info: (m: string) => addToast('info', m),
  };
}
