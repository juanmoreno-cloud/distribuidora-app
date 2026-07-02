import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Settings, LogOut } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import SyncBadge from './SyncBadge';
import ConfigPage from '../pages/ConfigPage';

// Acciones comunes del header, disponibles para TODOS los roles:
// insignia de sincronización, acceso a Configuración y cerrar sesión.
export default function HeaderAcciones() {
  const { logout } = useAuth();
  const [mostrarConfig, setMostrarConfig] = useState(false);

  return (
    <div className="flex items-center gap-1">
      <SyncBadge />
      <button className="btn-ghost !min-h-[40px] !px-3 text-sm" onClick={() => setMostrarConfig(true)} aria-label="Configuración">
        <Settings size={18} />
      </button>
      <button className="btn-ghost !min-h-[40px] !px-3 text-sm" onClick={logout} aria-label="Cerrar sesión">
        <LogOut size={18} />
      </button>
      {/* Portal al body: el header usa backdrop-blur, que "atrapa" a los
          elementos con position:fixed y recortaba esta pantalla en Carga/Despacho. */}
      {mostrarConfig && createPortal(<ConfigPage onCerrar={() => setMostrarConfig(false)} />, document.body)}
    </div>
  );
}
