import { useMemo, useState } from 'react';
import { Plus, Minus, Trash2, ShoppingCart, Check, MessageCircle, AlertTriangle, FileText } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import type { Cliente, LineaPedido, Pedido, Producto } from '../types';
import { db } from '../db/database';
import { formatoMoneda, hoyISO, mananaISO } from '../utils/formatters';
import { textoPedidoWhatsApp, compartirWhatsApp } from '../utils/whatsapp';
import { leerSesion } from '../hooks/useSession';
import { toast } from './Toast';
import ClienteAutocomplete from './ClienteAutocomplete';
import ProductoModal from './ProductoModal';
import ClienteForm from './ClienteForm';

export default function NuevoPedido() {
  const sesion = leerSesion();
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [fechaPedido, setFechaPedido] = useState(hoyISO());
  const [fechaEntrega, setFechaEntrega] = useState(mananaISO());
  const [lineas, setLineas] = useState<LineaPedido[]>([]);
  const [notas, setNotas] = useState('');
  const [mostrarModal, setMostrarModal] = useState(false);
  const [mostrarFormCliente, setMostrarFormCliente] = useState(false);
  const [confirmado, setConfirmado] = useState<Pedido | null>(null);

  // Crédito disponible del cliente (para la advertencia).
  const totalPendiente = useLiveQuery(async () => {
    if (!cliente) return 0;
    const pedidos = await db.pedidos.where('cliente_id').equals(cliente.id).toArray();
    return pedidos
      .filter((p) => p.tipo_pago === 'Crédito' && p.estado_pedido !== 'Cancelado' && p.estado_pedido !== 'Entregado')
      .reduce((s, p) => s + p.total_pedido, 0);
  }, [cliente]) ?? 0;

  const total = useMemo(() => lineas.reduce((s, l) => s + l.subtotal, 0), [lineas]);

  // Advertencia de crédito (no bloquea, solo avisa).
  const excedeCredito =
    cliente?.tipo_pago === 'Crédito' &&
    cliente.limite_credito > 0 &&
    totalPendiente + total > cliente.limite_credito;

  function agregarProducto(p: Producto) {
    setMostrarModal(false);
    setLineas((prev) => {
      const existe = prev.find((l) => l.producto_codigo === p.codigo);
      if (existe) {
        return prev.map((l) =>
          l.producto_codigo === p.codigo
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

  async function confirmar() {
    if (!cliente) { toast('Selecciona un cliente primero.', 'error'); return; }
    if (lineas.length === 0) { toast('Agrega al menos un producto.', 'error'); return; }

    const pedido: Pedido = {
      id: crypto.randomUUID(),
      // Se ancla al mediodía local para que el día no se corra por zona horaria.
      fecha_pedido: new Date(fechaPedido + 'T12:00:00').toISOString(),
      fecha_entrega: new Date(fechaEntrega + 'T12:00:00').toISOString(),
      vendedor: sesion?.vendedor ?? '',
      ruta: cliente.ruta || sesion?.ruta || '',
      cliente_id: cliente.id,
      cliente_nombre: cliente.nombre_fantasia || cliente.razon_social,
      tipo_pago: cliente.tipo_pago,
      estado_pedido: 'Pendiente',
      lineas,
      total_pedido: total,
      notas: notas.trim(),
      sincronizado: false,
    };

    try {
      await db.pedidos.add(pedido);
      setConfirmado(pedido);
      toast('Pedido guardado. Se sincronizará cuando haya internet.', 'success');
    } catch (e) {
      toast('Error guardando el pedido: ' + (e as Error).message, 'error');
    }
  }

  function nuevoPedido() {
    setCliente(null);
    setFechaPedido(hoyISO());
    setFechaEntrega(mananaISO());
    setLineas([]);
    setNotas('');
    setConfirmado(null);
  }

  // ---- Pantalla de resumen tras confirmar ----
  if (confirmado) {
    return (
      <div className="p-4 space-y-4">
        <div className="card p-5 text-center">
          <div className="mx-auto bg-green-100 text-green-600 rounded-full w-16 h-16 flex items-center justify-center mb-3">
            <Check size={32} />
          </div>
          <h2 className="text-xl font-bold">¡Pedido confirmado!</h2>
          <p className="text-gray-500 text-sm">{confirmado.cliente_nombre}</p>
          <p className="text-3xl font-bold text-green-600 mt-3">{formatoMoneda(confirmado.total_pedido)}</p>
          <p className="text-xs text-gray-400 mt-1">{confirmado.lineas.length} producto(s) · 🟡 Pendiente de sincronizar</p>
        </div>
        <button className="btn-success w-full" onClick={() => compartirWhatsApp(textoPedidoWhatsApp(confirmado))}>
          <MessageCircle size={18} /> Compartir por WhatsApp
        </button>
        <button className="btn-primary w-full" onClick={nuevoPedido}>
          <Plus size={18} /> Tomar otro pedido
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 pb-40">
      {/* Paso 1: Cliente */}
      <section className="space-y-2">
        <p className="text-sm font-semibold text-gray-700">1. Cliente</p>
        <ClienteAutocomplete
          seleccionado={cliente}
          onSeleccionar={setCliente}
          onRegistrarNuevo={() => setMostrarFormCliente(true)}
        />
      </section>

      {/* Paso 2: Fechas */}
      <section className="space-y-2">
        <p className="text-sm font-semibold text-gray-700">2. Fechas</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Pedido</label>
            <input type="date" className="input" value={fechaPedido} onChange={(e) => setFechaPedido(e.target.value)} />
          </div>
          <div>
            <label className="label">Entrega</label>
            <input type="date" className="input" value={fechaEntrega} onChange={(e) => setFechaEntrega(e.target.value)} />
          </div>
        </div>
      </section>

      {/* Paso 3: Carrito */}
      <section className="space-y-2">
        <p className="text-sm font-semibold text-gray-700">3. Productos</p>

        {cliente?.tipo_pago === 'Crédito' && cliente.limite_credito > 0 && (
          <div className="text-xs text-gray-500">
            Límite de crédito: {formatoMoneda(cliente.limite_credito)} ·
            Disponible: {formatoMoneda(Math.max(0, cliente.limite_credito - totalPendiente))}
          </div>
        )}

        {lineas.length === 0 && (
          <div className="card p-6 text-center text-gray-400">
            <ShoppingCart size={32} className="mx-auto mb-2" />
            Aún no hay productos. Toca “Agregar producto”.
          </div>
        )}

        {lineas.map((l) => (
          <div key={l.producto_codigo} className="card p-3">
            <div className="flex items-start justify-between gap-2">
              <p className="font-medium text-sm flex-1">{l.producto_descripcion}</p>
              <button className="text-red-500 p-1" onClick={() => eliminar(l.producto_codigo)}><Trash2 size={18} /></button>
            </div>
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-2">
                <button className="bg-gray-100 rounded-lg w-9 h-9 flex items-center justify-center" onClick={() => cambiarCantidad(l.producto_codigo, l.cantidad - 1)}><Minus size={16} /></button>
                <input
                  type="number" inputMode="decimal" min={1}
                  className="w-16 text-center input !min-h-[36px] !px-1"
                  value={l.cantidad}
                  onChange={(e) => cambiarCantidad(l.producto_codigo, Number(e.target.value))}
                />
                <button className="bg-gray-100 rounded-lg w-9 h-9 flex items-center justify-center" onClick={() => cambiarCantidad(l.producto_codigo, l.cantidad + 1)}><Plus size={16} /></button>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 text-xs text-gray-500 justify-end">
                  $<input
                    type="number" inputMode="decimal" step="0.01"
                    className="w-16 text-right input !min-h-[32px] !px-1"
                    value={l.precio_unitario}
                    onChange={(e) => cambiarPrecio(l.producto_codigo, Number(e.target.value))}
                  />
                </div>
                <p className="font-semibold">{formatoMoneda(l.subtotal)}</p>
              </div>
            </div>
          </div>
        ))}

        <button className="btn-primary w-full" onClick={() => setMostrarModal(true)}>
          <Plus size={18} /> Agregar producto
        </button>
      </section>

      {/* Notas */}
      <section className="space-y-2">
        <label className="label flex items-center gap-1"><FileText size={14} /> Notas</label>
        <textarea className="input min-h-[60px] py-2" value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Instrucciones especiales…" />
      </section>

      {excedeCredito && (
        <div className="card p-3 bg-orange-50 border-orange-200 flex items-center gap-2 text-orange-800 text-sm">
          <AlertTriangle size={18} />
          Este pedido supera el límite de crédito disponible. Quedará para aprobación del admin.
        </div>
      )}

      {/* Barra fija: total + confirmar */}
      <div className="fixed bottom-16 left-0 right-0 max-w-2xl mx-auto bg-white border-t border-gray-200 p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-500">Total del pedido</span>
          <span className="text-2xl font-bold text-green-600">{formatoMoneda(total)}</span>
        </div>
        <button className="btn-success w-full" onClick={confirmar}>
          <Check size={18} /> CONFIRMAR PEDIDO
        </button>
      </div>

      {mostrarModal && <ProductoModal onElegir={agregarProducto} onCerrar={() => setMostrarModal(false)} />}
      {mostrarFormCliente && <ClienteForm onCerrar={() => setMostrarFormCliente(false)} />}
    </div>
  );
}
