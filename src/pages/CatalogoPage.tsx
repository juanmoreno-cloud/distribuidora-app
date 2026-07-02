import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { ArrowLeft, Search, Save, Loader2 } from 'lucide-react';
import { db } from '../db/database';
import type { Producto } from '../types';
import { formatoMoneda } from '../utils/formatters';
import { toast } from '../components/Toast';

// Catálogo (SOLO admin): editar precios y stock (inventario) desde la app.
// Los cambios quedan pendientes y se suben a Google Sheets al sincronizar.
export default function CatalogoPage() {
  const navigate = useNavigate();
  const [q, setQ] = useState('');

  const productos = useLiveQuery(() => db.productos.toArray(), []) ?? [];
  const pendientes = productos.filter((p) => p.sincronizado === false).length;

  const texto = q.trim().toLowerCase();
  const filtrados = (texto
    ? productos.filter((p) => p.descripcion.toLowerCase().includes(texto) || String(p.codigo).includes(texto))
    : productos
  ).sort((a, b) => a.descripcion.localeCompare(b.descripcion));

  return (
    <div>
      <header className="sticky top-0 z-30 bg-gray-100/95 px-4 py-3 flex items-center gap-2 border-b border-gray-200">
        <button className="btn-ghost !min-h-[40px] !px-3" onClick={() => navigate('/')}><ArrowLeft size={18} /></button>
        <h1 className="text-lg font-bold flex-1">Catálogo y precios</h1>
      </header>

      <div className="p-4 space-y-3 pb-24">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input pl-10" placeholder="Buscar producto o código…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>

        {pendientes > 0 && (
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            ⏳ {pendientes} producto(s) con cambios pendientes de subir. Se suben al sincronizar.
          </p>
        )}
        <p className="text-sm text-gray-500">{filtrados.length} producto(s)</p>

        {filtrados.map((p) => <ProductoCard key={p.codigo} producto={p} />)}
      </div>
    </div>
  );
}

function ProductoCard({ producto: p }: { producto: Producto }) {
  const [precio, setPrecio] = useState(String(p.precio_unitario));
  const [stock, setStock] = useState(p.stock != null ? String(p.stock) : '');
  const [guardando, setGuardando] = useState(false);

  const precioNum = Number(precio);
  const stockNum = stock === '' ? undefined : Math.max(0, Number(stock) || 0);
  const cambio = precioNum !== p.precio_unitario || stockNum !== p.stock;

  async function guardar() {
    if (!(precioNum > 0)) { toast('El precio debe ser mayor que 0.', 'error'); return; }
    setGuardando(true);
    try {
      await db.productos.update(p.codigo, {
        precio_unitario: precioNum,
        stock: stockNum,
        sincronizado: false, // pendiente de subir a Sheets
      });
      toast(`${p.descripcion}: guardado ✓`, 'success');
    } catch (e) {
      toast('Error: ' + (e as Error).message, 'error');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="card p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-medium text-sm">{p.descripcion}</p>
          <p className="text-[11px] text-gray-400">#{p.codigo} · {p.grupo} · {p.unidad} · actual: {formatoMoneda(p.precio_unitario)}</p>
        </div>
        {p.sincronizado === false && <span className="text-[10px] shrink-0">🟡</span>}
      </div>
      <div className="flex items-end gap-2 mt-2">
        <div className="flex-1">
          <label className="label !mb-0.5 !text-xs">Precio ($)</label>
          <input type="number" inputMode="decimal" step="0.01" min="0" className="input !min-h-[40px]"
            value={precio} onChange={(e) => setPrecio(e.target.value)} />
        </div>
        <div className="flex-1">
          <label className="label !mb-0.5 !text-xs">Stock (vacío = sin control)</label>
          <input type="number" inputMode="numeric" min="0" className="input !min-h-[40px]"
            value={stock} placeholder="—" onChange={(e) => setStock(e.target.value)} />
        </div>
        <button className="btn-primary !min-h-[40px] !px-3" onClick={guardar} disabled={guardando || !cambio}>
          {guardando ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
        </button>
      </div>
    </div>
  );
}
