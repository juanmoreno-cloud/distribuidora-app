import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Search, X } from 'lucide-react';
import { db } from '../db/database';
import type { Producto } from '../types';
import { formatoMoneda } from '../utils/formatters';

// Bottom-sheet para elegir un producto del catálogo y agregarlo al carrito.
export default function ProductoModal({
  onElegir,
  onCerrar,
}: {
  onElegir: (p: Producto) => void;
  onCerrar: () => void;
}) {
  const [q, setQ] = useState('');
  const productos = useLiveQuery(() => db.productos.toArray(), []) ?? [];

  const texto = q.trim().toLowerCase();
  const filtrados = texto
    ? productos.filter((p) =>
        p.descripcion.toLowerCase().includes(texto) || String(p.codigo).includes(texto))
    : productos;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/40" onClick={onCerrar}>
      <div className="bg-white rounded-t-2xl max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold">Agregar producto</h2>
            <button className="btn-ghost !min-h-[36px] !px-3" onClick={onCerrar}><X size={18} /></button>
          </div>
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input className="input pl-10" autoFocus placeholder="Buscar por nombre o código…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        </div>

        <div className="overflow-y-auto divide-y divide-gray-100">
          {filtrados.map((p) => (
            <button
              key={p.codigo}
              className="w-full text-left p-3 flex items-center justify-between gap-2 active:bg-gray-50"
              onClick={() => onElegir(p)}
            >
              <div className="min-w-0">
                <p className="font-medium text-sm">{p.descripcion}</p>
                <p className="text-xs text-gray-500">
                  #{p.codigo} · {p.grupo} · {p.unidad}
                  {p.stock != null && (
                    <span className={p.stock <= 0 ? 'text-red-600 font-medium' : 'text-green-700'}> · stock: {p.stock}</span>
                  )}
                </p>
              </div>
              <span className="font-semibold text-marca shrink-0">{formatoMoneda(p.precio_unitario)}</span>
            </button>
          ))}
          {filtrados.length === 0 && <p className="p-6 text-center text-gray-400">Sin resultados.</p>}
        </div>
      </div>
    </div>
  );
}
