import { useState } from 'react';
import { Truck } from 'lucide-react';
import { VENDEDORES, RUTAS, type Vendedor, type Ruta } from '../types';
import { guardarSesion } from '../hooks/useSession';

// Pantalla de inicio de jornada. Sin contraseña: solo elegir vendedor y ruta.
export default function LoginPage() {
  const [vendedor, setVendedor] = useState<Vendedor | ''>('');
  const [ruta, setRuta] = useState<Ruta | ''>('');

  const puedeIniciar = vendedor !== '' && ruta !== '';

  function iniciar() {
    if (!puedeIniciar) return;
    guardarSesion({ vendedor: vendedor as Vendedor, ruta: ruta as Ruta });
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-marca to-blue-700 text-white">
      <div className="flex flex-col items-center mb-8">
        <div className="bg-white/20 rounded-3xl p-5 mb-4">
          <Truck size={56} />
        </div>
        <h1 className="text-2xl font-bold">Distribuidora App</h1>
        <p className="text-white/80 text-sm">Ventas y despacho en ruta</p>
      </div>

      <div className="card w-full max-w-sm p-5 text-gray-900 space-y-4">
        <div>
          <label className="label">Vendedor</label>
          <select className="input" value={vendedor} onChange={(e) => setVendedor(e.target.value as Vendedor)}>
            <option value="">Selecciona tu nombre…</option>
            {VENDEDORES.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Ruta asignada hoy</label>
          <select className="input" value={ruta} onChange={(e) => setRuta(e.target.value as Ruta)}>
            <option value="">Selecciona la ruta…</option>
            {RUTAS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>

        <button className="btn-success w-full" disabled={!puedeIniciar} onClick={iniciar}>
          INICIAR JORNADA
        </button>
      </div>
    </div>
  );
}
