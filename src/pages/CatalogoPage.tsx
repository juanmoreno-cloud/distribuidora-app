import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { ArrowLeft, Search, Save, Loader2, Plus, X } from 'lucide-react';
import { db } from '../db/database';
import type { Producto } from '../types';
import { formatoMoneda } from '../utils/formatters';
import { toast } from '../components/Toast';
import { useAuth } from '../auth/AuthContext';
import HeaderAcciones from '../components/HeaderAcciones';

// Catálogo (admin y Analista de Inventario): editar productos, precios y
// stock, y AGREGAR productos nuevos. Los cambios quedan pendientes y se
// suben a Google Sheets al sincronizar (pushCatalogo hace upsert).
export default function CatalogoPage() {
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const esAnalista = usuario?.rol === 'inventario'; // su única pantalla: sin botón volver
  const [q, setQ] = useState('');
  const [mostrarNuevo, setMostrarNuevo] = useState(false);

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
        {!esAnalista && (
          <button className="btn-ghost !min-h-[40px] !px-3" onClick={() => navigate('/')}><ArrowLeft size={18} /></button>
        )}
        <h1 className="text-lg font-bold flex-1">Catálogo y precios</h1>
        <HeaderAcciones />
      </header>

      <div className="p-4 space-y-3 pb-24">
        <button className="btn-primary w-full" onClick={() => setMostrarNuevo(true)}>
          <Plus size={18} /> Nuevo producto
        </button>

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

      {mostrarNuevo && <NuevoProductoModal productos={productos} onCerrar={() => setMostrarNuevo(false)} />}
    </div>
  );
}

// Alta de un producto nuevo (código único). Sube a Sheets al sincronizar.
function NuevoProductoModal({ productos, onCerrar }: { productos: Producto[]; onCerrar: () => void }) {
  const [f, setF] = useState({ codigo: '', descripcion: '', grupo: '', sub_grupo: '', precio: '', unidad: 'UNID', stock: '' });
  const [guardando, setGuardando] = useState(false);

  const grupos = [...new Set(productos.map((p) => p.grupo).filter(Boolean))].sort();
  const unidades = [...new Set(productos.map((p) => p.unidad).filter(Boolean))].sort();

  function set<K extends keyof typeof f>(k: K, v: string) { setF((prev) => ({ ...prev, [k]: v })); }

  async function guardar() {
    const codigo = Number(f.codigo);
    if (!codigo || codigo <= 0) { toast('Código inválido (número mayor que 0).', 'error'); return; }
    if (!f.descripcion.trim()) { toast('Escribe la descripción del producto.', 'error'); return; }
    const precio = Number(f.precio);
    if (!(precio > 0)) { toast('El precio debe ser mayor que 0.', 'error'); return; }
    if (await db.productos.get(codigo)) { toast(`El código ${codigo} ya existe.`, 'error'); return; }

    setGuardando(true);
    try {
      await db.productos.add({
        codigo,
        descripcion: f.descripcion.trim().toUpperCase(),
        grupo: f.grupo.trim().toUpperCase(),
        sub_grupo: f.sub_grupo.trim().toUpperCase(),
        precio_unitario: precio,
        unidad: f.unidad.trim().toUpperCase() || 'UNID',
        stock: f.stock === '' ? undefined : Math.max(0, Number(f.stock) || 0),
        sincronizado: false, // pendiente de subir a Sheets
      });
      toast('Producto creado ✓', 'success');
      onCerrar();
    } catch (e) {
      toast('Error: ' + (e as Error).message, 'error');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4 overflow-y-auto" onClick={onCerrar}>
      <div className="card w-full max-w-sm p-5 space-y-3 my-8" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-bold">Nuevo producto</h3>
          <button className="p-1 text-gray-500" onClick={onCerrar}><X size={18} /></button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Código</label>
            <input className="input" type="number" inputMode="numeric" value={f.codigo} onChange={(e) => set('codigo', e.target.value)} placeholder="Ej: 2001" />
          </div>
          <div>
            <label className="label">Precio ($)</label>
            <input className="input" type="number" inputMode="decimal" step="0.01" value={f.precio} onChange={(e) => set('precio', e.target.value)} />
          </div>
        </div>
        <div>
          <label className="label">Descripción</label>
          <input className="input" value={f.descripcion} onChange={(e) => set('descripcion', e.target.value)} placeholder="Ej: QUESO AMARILLO *KG" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Grupo</label>
            <input className="input" list="grupos-existentes" value={f.grupo} onChange={(e) => set('grupo', e.target.value)} placeholder="Ej: CHARCUTERIA" />
            <datalist id="grupos-existentes">{grupos.map((g) => <option key={g} value={g} />)}</datalist>
          </div>
          <div>
            <label className="label">Sub-grupo</label>
            <input className="input" value={f.sub_grupo} onChange={(e) => set('sub_grupo', e.target.value)} placeholder="Ej: QUESOS" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Unidad</label>
            <input className="input" list="unidades-existentes" value={f.unidad} onChange={(e) => set('unidad', e.target.value)} />
            <datalist id="unidades-existentes">{unidades.map((u) => <option key={u} value={u} />)}</datalist>
          </div>
          <div>
            <label className="label">Stock inicial</label>
            <input className="input" type="number" inputMode="numeric" min="0" value={f.stock} placeholder="—" onChange={(e) => set('stock', e.target.value)} />
          </div>
        </div>
        <button className="btn-success w-full" onClick={guardar} disabled={guardando}>
          {guardando ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />} Crear producto
        </button>
      </div>
    </div>
  );
}

function ProductoCard({ producto: p }: { producto: Producto }) {
  const [descripcion, setDescripcion] = useState(p.descripcion);
  const [precio, setPrecio] = useState(String(p.precio_unitario));
  const [stock, setStock] = useState(p.stock != null ? String(p.stock) : '');
  const [guardando, setGuardando] = useState(false);

  const precioNum = Number(precio);
  const stockNum = stock === '' ? undefined : Math.max(0, Number(stock) || 0);
  const cambio = precioNum !== p.precio_unitario || stockNum !== p.stock || descripcion.trim() !== p.descripcion;

  async function guardar() {
    if (!(precioNum > 0)) { toast('El precio debe ser mayor que 0.', 'error'); return; }
    if (!descripcion.trim()) { toast('La descripción no puede quedar vacía.', 'error'); return; }
    setGuardando(true);
    try {
      await db.productos.update(p.codigo, {
        descripcion: descripcion.trim().toUpperCase(),
        precio_unitario: precioNum,
        stock: stockNum,
        sincronizado: false, // pendiente de subir a Sheets
      });
      toast('Producto guardado ✓', 'success');
    } catch (e) {
      toast('Error: ' + (e as Error).message, 'error');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="card p-3">
      <div className="flex items-start justify-between gap-2">
        <input className="input !min-h-[38px] text-sm font-medium flex-1" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
        {p.sincronizado === false && <span className="text-[10px] shrink-0 mt-2">🟡</span>}
      </div>
      <p className="text-[11px] text-gray-400 mt-1">#{p.codigo} · {p.grupo} · {p.unidad} · actual: {formatoMoneda(p.precio_unitario)}</p>
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
