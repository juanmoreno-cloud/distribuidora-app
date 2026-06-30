import { RefreshCw, Check } from 'lucide-react';
import { useSync } from '../hooks/useSync';

// Botón/insignia de sincronización: muestra cuántos registros están
// pendientes y permite sincronizar manualmente.
export default function SyncBadge() {
  const { pendientes, sincronizando, sincronizar } = useSync();

  return (
    <button
      className="btn-ghost !min-h-[40px] text-sm relative"
      onClick={() => sincronizar(false)}
      disabled={sincronizando}
    >
      <RefreshCw size={16} className={sincronizando ? 'animate-spin' : ''} />
      {pendientes > 0 ? (
        <span className="text-amber-700">⏳ {pendientes}</span>
      ) : (
        <span className="text-green-700 flex items-center gap-1"><Check size={14} /> Al día</span>
      )}
    </button>
  );
}
