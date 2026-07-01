import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { KeyRound, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { PERMISOS } from '../auth/permisos';
import { esClaveFuerte } from '../utils/validators';
import { toast } from '../components/Toast';

// Cambio obligatorio de la contraseña temporal en el primer login.
export default function CambiarClavePage() {
  const { usuario, cambiarClave } = useAuth();
  const navigate = useNavigate();
  const [actual, setActual] = useState('');
  const [nueva, setNueva] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [ver, setVer] = useState(false);
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  const fuerte = esClaveFuerte(nueva);
  const coincide = nueva.length > 0 && nueva === confirmar;

  async function guardar() {
    setError('');
    if (!fuerte) { setError('La nueva clave no cumple los requisitos.'); return; }
    if (!coincide) { setError('Las contraseñas no coinciden.'); return; }
    setGuardando(true);
    try {
      const r = await cambiarClave(actual, nueva);
      if (!r.ok) { setError(r.error || 'No se pudo cambiar la clave'); return; }
      toast('Contraseña actualizada ✓', 'success');
      navigate(usuario ? PERMISOS[usuario.rol].rutaInicial : '/');
    } finally {
      setGuardando(false);
    }
  }

  const Req = ({ ok, children }: { ok: boolean; children: string }) => (
    <li className={ok ? 'text-green-600' : 'text-gray-400'}>{ok ? '✓' : '•'} {children}</li>
  );

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-marca to-blue-700 text-white">
      <div className="flex flex-col items-center mb-6">
        <div className="bg-white/20 rounded-3xl p-4 mb-3"><KeyRound size={40} /></div>
        <h1 className="text-xl font-bold">Cambiar contraseña temporal</h1>
        <p className="text-white/80 text-sm text-center">Por seguridad, crea tu propia contraseña.</p>
      </div>

      <form className="card w-full max-w-sm p-5 text-gray-900 space-y-4" onSubmit={(e) => { e.preventDefault(); guardar(); }}>
        <div>
          <label className="label">Contraseña actual (temporal)</label>
          <input className="input" type={ver ? 'text' : 'password'} value={actual} onChange={(e) => setActual(e.target.value)} />
        </div>
        <div>
          <label className="label">Nueva contraseña</label>
          <div className="relative">
            <input className="input pr-12" type={ver ? 'text' : 'password'} value={nueva} onChange={(e) => setNueva(e.target.value)} />
            <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-500" onClick={() => setVer((v) => !v)}>
              {ver ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>
        <div>
          <label className="label">Confirmar nueva contraseña</label>
          <input className="input" type={ver ? 'text' : 'password'} value={confirmar} onChange={(e) => setConfirmar(e.target.value)} />
        </div>

        <ul className="text-xs space-y-0.5">
          <Req ok={nueva.length >= 8}>Mínimo 8 caracteres</Req>
          <Req ok={/[A-Z]/.test(nueva)}>Una mayúscula</Req>
          <Req ok={/[a-z]/.test(nueva)}>Una minúscula</Req>
          <Req ok={/[0-9]/.test(nueva)}>Un número</Req>
          <Req ok={/[^A-Za-z0-9]/.test(nueva)}>Un símbolo (ej: ! @ # $)</Req>
          <Req ok={coincide}>Las dos contraseñas coinciden</Req>
        </ul>

        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

        <button className="btn-success w-full" disabled={guardando || !fuerte || !coincide}>
          {guardando ? <Loader2 className="animate-spin" size={18} /> : null} GUARDAR Y CONTINUAR
        </button>
      </form>
    </div>
  );
}
