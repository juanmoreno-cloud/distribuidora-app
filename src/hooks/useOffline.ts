import { useEffect, useState } from 'react';

// Detecta si el dispositivo está sin conexión a internet.
export function useOffline(): boolean {
  const [offline, setOffline] = useState(!navigator.onLine);
  useEffect(() => {
    const online = () => setOffline(false);
    const off = () => setOffline(true);
    window.addEventListener('online', online);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', online);
      window.removeEventListener('offline', off);
    };
  }, []);
  return offline;
}
