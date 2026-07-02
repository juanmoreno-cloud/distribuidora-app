import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { PERMISOS } from '../auth/permisos';

// Pantalla de inicio de sesión con usuario y contraseña.
export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [clave, setClave] = useState('');
  const [verClave, setVerClave] = useState(false);
  const [error, setError] = useState('');
  const [entrando, setEntrando] = useState(false);

  async function iniciar() {
    setError('');
    setEntrando(true);
    try {
      const r = await login(username, clave);
      if (!r.ok) { setError(r.error || 'No se pudo iniciar sesión'); return; }
      // Si debe cambiar la clave temporal, ir a esa pantalla; si no, a su inicio.
      if (r.usuario!.debe_cambiar_clave) navigate('/cambiar-clave');
      else navigate(PERMISOS[r.usuario!.rol].rutaInicial);
    } finally {
      setEntrando(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-marca to-blue-700 text-white">
      <div className="flex flex-col items-center mb-8">
        <div className="bg-white/20 rounded-3xl p-5 mb-4"><Truck size={56} /></div>
        <h1 className="text-2xl font-bold">Distribuidora App</h1>
        <p className="text-white/80 text-sm">Ventas y despacho en ruta</p>
      </div>

      <form
        className="card w-full max-w-sm p-5 text-gray-900 space-y-4"
        onSubmit={(e) => { e.preventDefault(); iniciar(); }}
      >
        <div>
          <label className="label">Usuario</label>
          <input
            className="input" autoCapitalize="none" autoCorrect="off"
            placeholder="Ej: VendedorR1_1"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>

        <div>
          <label className="label">Contraseña</label>
          <div className="relative">
            <input
              className="input pr-12" type={verClave ? 'text' : 'password'}
              placeholder="Tu contraseña"
              value={clave}
              onChange={(e) => setClave(e.target.value)}
            />
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-500"
              onClick={() => setVerClave((v) => !v)}
              aria-label="Mostrar u ocultar contraseña"
            >
              {verClave ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
        )}

        <button className="btn-success w-full" disabled={entrando}>
          {entrando ? <Loader2 className="animate-spin" size={18} /> : null} INICIAR SESIÓN
        </button>

        <p className="text-xs text-gray-500 text-center">
          ¿Problemas? Contacta al admin: <a className="text-marca font-medium" href="tel:04122168070">0412-2168070</a>
        </p>
      </form>
    </div>
  );
}
