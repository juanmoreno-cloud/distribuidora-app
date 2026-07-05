import { useMemo, useState } from 'react';
import { X, Save, Plus, Minus, Trash2, Loader2 } from 'lucide-react';
import { ESTADOS_PEDIDO, type Pedido, type LineaPedido, type Producto, type EstadoPedido } from '../types';
import { db } from '../db/database';
import { formatoMoneda, aFechaInput } from '../utils/formatters';
import { toast } from './Toast';
import ProductoModal from './ProductoModal';

// Edición de un pedido existente (SOLO admin). Al guardar, el pedido queda
// pendiente de sincronizar (sincronizado=false) y Carga/Despacho se
// recalculan solos porque derivan de los pedidos.
export default function EditarPedido({ pedido, onCerrar }: { pedido: Pedido; onCerrar: () => void }) {
  const [lineas, setLineas] = useState<LineaPedido[]>(pedido.lineas.map((l) => ({ ...l })));
  const [fechaEntrega, setFechaEntrega] = useState(aFechaInput(pedido.fecha_entrega));
  const [estado, setEstado] = useState<EstadoPedido>(pedido.estado_pedido);
  const [notas, setNotas] = useState(pedido.notas);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const total = useMemo(() => lineas.reduce((s, l) => s + l.subtotal, 0), [lineas]);

  function cambiarCantidad(codigo: number, cantidad: number) {
    if (cantidad < 1) return;
    setLineas((prev) => prev.map((l) =>
      l.producto_codigo === codigo ? { ...l, cantidad, subtotal: cantidad * l.precio_unitario } : l));
  }

  function cambiarPrecio(codigo: number, precio: number) {
    setLineas((prev) => prev.map((l) =>
      l.producto_codigo === codigo ? { ...l, precio_unitario: precio, subtotal: l.cantidad * precio } : l));
  }

  function eliminar(codigo: number) {
    setLineas((prev) => prev.filter((l) => l.producto_codigo !== codigo));
  }

  function agregarProducto(p: Producto) {
    setMostrarModal(false);
    setLineas((prev) => {
      const existe = prev.find((l) => l.producto_codigo === p.codigo);
      if (existe) {
        return prev.map((l) => l.producto_codigo === p.codigo
          ? { ...l, cantidad: l.cantidad + 1, subtotal: (l.cantidad + 1) * l.precio_unitario }
          : l);
      }
      return [...prev, {
        producto_codigo: p.codigo,
        producto_descripcion: p.descripcion,
        cantidad: 1,
        precio_unitario: p.precio_unitario,
        subtotal: p.precio_unitario,
      }];
    });
  }

  async function guardar() {
    if (lineas.length === 0) { toast('El pedido debe tener al menos un producto.', 'error'); return; }
    setGuardando(true);
    try {
      await db.pedidos.update(pedido.id, {
        lineas,
        total_pedido: total,
        fecha_entrega: new Date(fechaEntrega + 'T12:00:00').toISOString(),
        estado_pedido: estado,
        entregado: estado === 'Entregado', // coherente con el checkbox de Despacho
        notas: notas.trim(),
        sincronizado: false, // se vuelve a subir a Sheets con los cambios
        actualizado_en: new Date().toISOString(),
      });
      toast('Pedido actualizado ✓', 'success');
      onCerrar();
    } catch (e) {
      toast('Error guardando: ' + (e as Error).message, 'error');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] bg-gray-100 overflow-y-auto">
      <header className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between z-10">
        <div>
          <h2 className="text-lg font-bold">Editar Pedido</h2>
          <p className="text-xs text-gray-500">{pedido.cliente_nombre} · {pedido.vendedor}</p>
        </div>
        <button className="btn-ghost !min-h-[40px] !px-3" onClick={onCerrar}><X size={18} /></button>
      </header>

      <div className="p-4 space-y-4 max-w-2xl mx-auto pb-36">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Fecha de entrega</label>
            <input type="date" className="input" value={fechaEntrega} onChange={(e) => setFechaEntrega(e.target.value)} />
          </div>
          <div>
            <label className="label">Estado</label>
            <select className="input" value={estado} onChange={(e) => setEstado(e.target.value as EstadoPedido)}>
              {ESTADOS_PEDIDO.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {lineas.map((l) => (
          <div key={l.producto_codigo} className="card p-3">
            <div className="flex items-start justify-between gap-2">
              <p className="font-medium text-sm flex-1">{l.producto_descripcion}</p>
              <button className="text-red-500 p-1" onClick={() => eliminar(l.producto_codigo)}><Trash2 size={18} /></button>
            </div>
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-2">
                <button className="bg-gray-100 rounded-lg w-9 h-9 flex items-center justify-center" onClick={() => cambiarCantidad(l.producto_codigo, l.cantidad - 1)}><Minus size={16} /></button>
                <input type="number" inputMode="decimal" min={1}
                  className="w-16 text-center input !min-h-[36px] !px-1"
                  value={l.cantidad}
                  onChange={(e) => cambiarCantidad(l.producto_codigo, Number(e.target.value))} />
                <button className="bg-gray-100 rounded-lg w-9 h-9 flex items-center justify-center" onClick={() => cambiarCantidad(l.producto_codigo, l.cantidad + 1)}><Plus size={16} /></button>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 text-xs text-gray-500 justify-end">
                  $<input type="number" inputMode="decimal" step="0.01"
                    className="w-16 text-right input !min-h-[32px] !px-1"
                    value={l.precio_unitario}
                    onChange={(e) => cambiarPrecio(l.producto_codigo, Number(e.target.value))} />
                </div>
                <p className="font-semibold">{formatoMoneda(l.subtotal)}</p>
              </div>
            </div>
          </div>
        ))}

        <button className="btn-primary w-full" onClick={() => setMostrarModal(true)}>
          <Plus size={18} /> Agregar producto
        </button>

        <div>
          <label className="label">Notas</label>
          <textarea className="input min-h-[60px] py-2" value={notas} onChange={(e) => setNotas(e.target.value)} />
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-500">Nuevo total</span>
          <span className="text-2xl font-bold text-green-600">{formatoMoneda(total)}</span>
        </div>
        <button className="btn-success w-full" onClick={guardar} disabled={guardando}>
          {guardando ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} GUARDAR CAMBIOS
        </button>
      </div>

      {mostrarModal && <ProductoModal onElegir={agregarProducto} onCerrar={() => setMostrarModal(false)} />}
    </div>
  );
}
