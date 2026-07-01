import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { ArrowLeft, Plus, Pencil } from 'lucide-react';
import { db } from '../db/database';
import { ETIQUETA_ROL, type Usuario, type Rol } from '../types';
import { useAuth } from '../auth/AuthContext';
import { toast } from '../components/Toast';
import UsuarioForm from '../components/UsuarioForm';

const COLOR_ROL: Record<Rol, string> = {
  vendedor: 'bg-green-100 text-green-700',
  despachador: 'bg-orange-100 text-orange-700',
  almacenista: 'bg-blue-100 text-blue-700',
  admin: 'bg-red-100 text-red-700',
};

// Gestión de usuarios (solo admin).
export default function UsuariosPage() {
  const navigate = useNavigate();
  const { usuario: yo } = useAuth();
  const [editar, setEditar] = useState<Usuario | null>(null);
  const [nuevo, setNuevo] = useState(false);

  const usuarios = useLiveQuery(() => db.usuarios.toArray(), []) ?? [];
  const adminsActivos = usuarios.filter((u) => u.rol === 'admin' && u.activo);

  function esUnicoAdminActivo(u: Usuario): boolean {
    return u.rol === 'admin' && u.activo && adminsActivos.length <= 1;
  }

  async function alternarActivo(u: Usuario) {
    if (u.activo && esUnicoAdminActivo(u)) {
      toast('No puedes desactivar al único administrador activo.', 'error');
      return;
    }
    await db.usuarios.update(u.id, { activo: !u.activo });
  }

  return (
    <div>
      <header className="sticky top-0 z-30 bg-gray-100/95 backdrop-blur px-4 py-3 flex items-center gap-2 border-b border-gray-200">
        <button className="btn-ghost !min-h-[40px] !px-3" onClick={() => navigate('/')}><ArrowLeft size={18} /></button>
        <h1 className="text-lg font-bold flex-1">Gestión de Usuarios</h1>
        <button className="btn-primary !min-h-[40px] text-sm" onClick={() => setNuevo(true)}>
          <Plus size={18} /> Nuevo
        </button>
      </header>

      <div className="p-4 space-y-2 pb-24">
        <p className="text-sm text-gray-500">{usuarios.length} usuario(s)</p>
        {usuarios.map((u) => (
          <div key={u.id} className={`card p-3 ${u.activo ? '' : 'opacity-60'}`}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-semibold truncate">{u.nombre_completo}</p>
                <p className="text-xs text-gray-500">{u.username}</p>
                {u.ruta_asignada && <p className="text-xs text-gray-400">{u.ruta_asignada}</p>}
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full shrink-0 ${COLOR_ROL[u.rol]}`}>{ETIQUETA_ROL[u.rol]}</span>
            </div>

            <div className="flex items-center justify-between mt-3">
              {/* Toggle activo/inactivo */}
              <button
                onClick={() => alternarActivo(u)}
                className={`relative w-12 h-6 rounded-full transition ${u.activo ? 'bg-green-500' : 'bg-gray-300'}`}
                aria-label="Activar o desactivar usuario"
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition ${u.activo ? 'translate-x-6' : ''}`} />
              </button>
              <span className="text-xs text-gray-500 flex-1 ml-2">{u.activo ? 'Activo' : 'Inactivo'}</span>

              <button className="btn-ghost !min-h-[36px] !px-3 text-sm" onClick={() => setEditar(u)}>
                <Pencil size={15} /> Editar
              </button>
            </div>
          </div>
        ))}
      </div>

      {nuevo && (
        <UsuarioForm creadoPor={yo?.username ?? 'admin'} bloquearRolAdmin={false} onCerrar={() => setNuevo(false)} />
      )}
      {editar && (
        <UsuarioForm
          usuario={editar}
          creadoPor={yo?.username ?? 'admin'}
          bloquearRolAdmin={esUnicoAdminActivo(editar)}
          onCerrar={() => setEditar(null)}
        />
      )}
    </div>
  );
}
