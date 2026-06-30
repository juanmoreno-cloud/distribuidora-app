import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Search, X, UserPlus } from 'lucide-react';
import { db } from '../db/database';
import type { Cliente } from '../types';

// Buscador con autocompletado de clientes (nombre, razón social o RIF).
export default function ClienteAutocomplete({
  seleccionado,
  onSeleccionar,
  onRegistrarNuevo,
}: {
  seleccionado: Cliente | null;
  onSeleccionar: (c: Cliente | null) => void;
  onRegistrarNuevo: () => void;
}) {
  const [q, setQ] = useState('');
  const [abierto, setAbierto] = useState(false);
  const clientes = useLiveQuery(() => db.clientes.toArray(), []) ?? [];

  const texto = q.trim().toLowerCase();
  const resultados = texto
    ? clientes.filter((c) =>
        c.nombre_fantasia.toLowerCase().includes(texto) ||
        c.razon_social.toLowerCase().includes(texto) ||
        c.rif.toLowerCase().includes(texto)).slice(0, 8)
    : [];

  if (seleccionado) {
    return (
      <div className="card p-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold truncate">{seleccionado.nombre_fantasia || seleccionado.razon_social}</p>
          <p className="text-xs text-gray-500">{seleccionado.rif} · {seleccionado.tipo_pago}</p>
          {seleccionado.direccion && <p className="text-xs text-gray-500 truncate">{seleccionado.direccion}</p>}
        </div>
        <button className="btn-ghost !min-h-[36px] !px-3 text-sm" onClick={() => { onSeleccionar(null); setQ(''); }}>
          <X size={16} /> Cambiar
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          className="input pl-10"
          placeholder="Buscar cliente por nombre o RIF…"
          value={q}
          onChange={(e) => { setQ(e.target.value); setAbierto(true); }}
          onFocus={() => setAbierto(true)}
        />
      </div>

      {abierto && texto && (
        <div className="card mt-1 divide-y divide-gray-100 max-h-72 overflow-y-auto">
          {resultados.map((c) => (
            <button
              key={c.id}
              className="w-full text-left p-3 active:bg-gray-50"
              onClick={() => { onSeleccionar(c); setAbierto(false); }}
            >
              <p className="font-medium">{c.nombre_fantasia || c.razon_social}</p>
              <p className="text-xs text-gray-500">{c.rif} · {c.zona}</p>
            </button>
          ))}
          {resultados.length === 0 && (
            <div className="p-3">
              <p className="text-sm text-gray-500 mb-2">No se encontró ese cliente.</p>
              <button className="btn-primary w-full text-sm" onClick={onRegistrarNuevo}>
                <UserPlus size={18} /> Registrar cliente nuevo
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
