import { WifiOff } from 'lucide-react';
import { useOffline } from '../hooks/useOffline';

// Aviso fijo arriba cuando no hay internet. La app sigue funcionando igual.
export default function OfflineBanner() {
  const offline = useOffline();
  if (!offline) return null;
  return (
    <div className="bg-gray-800 text-white text-xs text-center py-1.5 flex items-center justify-center gap-2 sticky top-0 z-50">
      <WifiOff size={14} /> Sin conexión — los datos se guardan en el teléfono y se sincronizarán al volver el internet.
    </div>
  );
}
