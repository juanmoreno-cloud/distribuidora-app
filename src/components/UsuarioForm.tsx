import { useState } from 'react';
import { X, Save, Wand2, Eye, EyeOff, Loader2 } from 'lucide-react';
import { db } from '../db/database';
import { ROLES, ETIQUETA_ROL, RUTAS, type Usuario, type Rol } from '../types';
import { hashClave } from '../auth/hash';
import { esClaveFuerte, esUsernameValido } from '../utils/validators';
import { toast } from './Toast';

// Genera una contraseña segura al azar (cumple los requisitos).
function generarClaveSegura(): string {
  const may = 'ABCDEFGHJKLMNPQRSTUVWXYZ', min = 'abcdefghijkmnpqrstuvwxyz', num = '23456789', sim = '!@#$%&*';
  const todos = may + min + num + sim;
  const pick = (s: string) => s[Math.floor(Math.random() * s.length)];
  let c = pick(may) + pick(min) + pick(num) + pick(sim);
  for (let i = 0; i < 6; i++) c += pick(todos);
  return c.split('').sort(() => Math.random() - 0.5).join('');
}

// Formulario para crear o editar un usuario (solo admin).
export default function UsuarioForm({
  usuario, creadoPor, bloquearRolAdmin, onCerrar,
}: {
  usuario?: Usuario;          // si viene, es edición
  creadoPor: string;
  bloquearRolAdmin: boolean;  // true si es el único admin activo (no puede dejar de ser admin)
  onCerrar: () => void;
}) {
  const editando = !!usuario;
  const [nombre, setNombre] = useState(usuario?.nombre_completo ?? '');
  const [username, setUsername] = useState(usuario?.username ?? '');
  const [rol, setRol] = useState<Rol>(usuario?.rol ?? 'vendedor');
  const [ruta, setRuta] = useState(usuario?.ruta_asignada ?? '');
  const [clave, setClave] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [verClave, setVerClave] = useState(false);
  const [debeCambiar, setDebeCambiar] = useState(usuario?.debe_cambiar_clave ?? true);
  const [guardando, setGuardando] = useState(false);

  function autogenerar() {
    const c = generarClaveSegura();
    setClave(c); setConfirmar(c); setVerClave(true);
    toast('Clave generada. Anótala antes de guardar: ' + c, 'info');
  }

  async function guardar() {
    if (!nombre.trim()) { toast('Escribe el nombre completo.', 'error'); return; }
    if (!esUsernameValido(username)) { toast('Usuario inválido: 4+ caracteres, solo letras, números, puntos y guiones bajos.', 'error'); return; }
    if (bloquearRolAdmin && rol !== 'admin') { toast('No puedes quitarle el rol admin al único administrador activo.', 'error'); return; }

    // La clave es obligatoria al crear; opcional al editar (en blanco = no cambia).
    if (!editando || clave) {
      if (!esClaveFuerte(clave)) { toast('La clave debe tener 8+ caracteres, mayúscula, minúscula, número y símbolo.', 'error'); return; }
      if (clave !== confirmar) { toast('Las contraseñas no coinciden.', 'error'); return; }
    }

    setGuardando(true);
    try {
      if (!editando) {
        const existe = await db.usuarios.where('username').equals(username.trim()).first();
        if (existe) { toast('Ese usuario ya existe.', 'error'); return; }
        const nuevo: Usuario = {
          id: username.trim(),
          username: username.trim(),
          password: hashClave(clave),
          nombre_completo: nombre.trim(),
          rol,
          ruta_asignada: rol === 'vendedor' ? (ruta || undefined) : undefined,
          activo: true,
          fecha_creacion: new Date().toISOString(),
          creado_por: creadoPor,
          debe_cambiar_clave: debeCambiar,
        };
        await db.usuarios.add(nuevo);
        toast('Usuario creado ✓', 'success');
      } else {
        const actualizado: Usuario = {
          ...usuario!,
          nombre_completo: nombre.trim(),
          rol,
          ruta_asignada: rol === 'vendedor' ? (ruta || undefined) : undefined,
          debe_cambiar_clave: debeCambiar,
          ...(clave ? { password: hashClave(clave), debe_cambiar_clave: true } : {}),
        };
        await db.usuarios.put(actualizado);
        toast('Usuario actualizado ✓', 'success');
      }
      onCerrar();
    } catch (e) {
      toast('Error: ' + (e as Error).message, 'error');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] bg-gray-100 overflow-y-auto">
      <header className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <h2 className="text-lg font-bold">{editando ? 'Editar Usuario' : 'Nuevo Usuario'}</h2>
        <button className="btn-ghost !min-h-[40px] !px-3" onClick={onCerrar}><X size={18} /></button>
      </header>

      <div className="p-4 space-y-4 max-w-2xl mx-auto pb-32">
        <div>
          <label className="label">Nombre completo</label>
          <input className="input" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej: Juan Pérez" />
        </div>
        <div>
          <label className="label">Usuario</label>
          <input className="input disabled:bg-gray-100 disabled:text-gray-500" autoCapitalize="none"
            value={username} disabled={editando}
            onChange={(e) => setUsername(e.target.value)} placeholder="Ej: juan.perez" />
          {editando && <p className="text-xs text-gray-400 mt-1">El nombre de usuario no se puede cambiar.</p>}
        </div>

        <div>
          <label className="label">{editando ? 'Nueva contraseña (opcional)' : 'Contraseña temporal'}</label>
          <div className="relative">
            <input className="input pr-12" type={verClave ? 'text' : 'password'}
              value={clave} onChange={(e) => setClave(e.target.value)}
              placeholder={editando ? 'Dejar en blanco para no cambiar' : 'Contraseña temporal'} />
            <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-500" onClick={() => setVerClave((v) => !v)}>
              {verClave ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          <button type="button" className="btn-ghost !min-h-[40px] text-sm mt-2" onClick={autogenerar}>
            <Wand2 size={16} /> Generar clave segura
          </button>
        </div>
        <div>
          <label className="label">Confirmar contraseña</label>
          <input className="input" type={verClave ? 'text' : 'password'} value={confirmar} onChange={(e) => setConfirmar(e.target.value)} />
        </div>

        <div>
          <label className="label">Rol</label>
          <select className="input" value={rol} onChange={(e) => setRol(e.target.value as Rol)}>
            {ROLES.map((r) => <option key={r} value={r}>{ETIQUETA_ROL[r]}</option>)}
          </select>
          {bloquearRolAdmin && <p className="text-xs text-amber-600 mt-1">Es el único administrador activo: no puede dejar de ser admin.</p>}
        </div>

        {rol === 'vendedor' && (
          <div>
            <label className="label">Ruta asignada</label>
            <select className="input" value={ruta} onChange={(e) => setRuta(e.target.value)}>
              <option value="">Sin ruta</option>
              {RUTAS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        )}

        <label className="flex items-center gap-2 select-none">
          <input type="checkbox" className="w-5 h-5 accent-marca" checked={debeCambiar} onChange={(e) => setDebeCambiar(e.target.checked)} />
          <span>Debe cambiar la clave en el primer login</span>
        </label>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 max-w-2xl mx-auto">
        <button className="btn-success w-full" onClick={guardar} disabled={guardando}>
          {guardando ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} Guardar Usuario
        </button>
      </div>
    </div>
  );
}
