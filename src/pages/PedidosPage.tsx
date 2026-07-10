import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Trash2, Pencil, ChevronDown, ChevronUp } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import HeaderAcciones from '../components/HeaderAcciones';
import NuevoPedido from '../components/NuevoPedido';
import ConfirmModal from '../components/ConfirmModal';
import EditarPedido from '../components/EditarPedido';
import { db } from '../db/database';
import { formatoMoneda, fechaLegible, hoyISO } from '../utils/formatters';
import { leerSesion } from '../hooks/useSession';
import { useAuth } from '../auth/AuthContext';
import { esSoloLectura } from '../auth/permisos';
import { toast } from '../components/Toast';
import { eliminarPedido } from '../services/borrado';
import type { Pedido, EstadoPedido } from '../types';

// Colores del badge de estado del pedido.
const COLOR_ESTADO: Record<EstadoPedido, string> = {
  'Pendiente': 'bg-gray-100 text-gray-600',
  'Procesado': 'bg-blue-100 text-blue-700',
  'En ruta': 'bg-amber-100 text-amber-700',
  'Entregado': 'bg-green-100 text-green-700',
  'Cancelado': 'bg-red-100 text-red-700',
};

type Tab = 'nuevo' | 'dia' | 'historial';

export default function PedidosPage() {
  const { usuario } = useAuth();
  const soloLectura = esSoloLectura(usuario?.rol ?? 'lector');
  const [tab, setTab] = useState<Tab>(soloLectura ? 'dia' : 'nuevo');

  return (
    <div>
      <PageHeader titulo="Pedidos" accion={<HeaderAcciones />} />
      {!soloLectura && (
        <div className="flex gap-2 p-3 bg-gray-100 sticky top-[53px] z-20">
          <TabBtn activo={tab === 'nuevo'} onClick={() => setTab('nuevo')}>Nuevo pedido</TabBtn>
          <TabBtn activo={tab === 'dia'} onClick={() => setTab('dia')}>Pedidos del día</TabBtn>
          <TabBtn activo={tab === 'historial'} onClick={() => setTab('historial')}>Historial</TabBtn>
        </div>
      )}

      {tab === 'nuevo' ? <NuevoPedido /> : tab === 'dia' ? <PedidosDelDia /> : <HistorialPedidos />}
    </div>
  );
}

function TabBtn({ activo, onClick, children }: { activo: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 min-h-[44px] rounded-xl font-medium text-sm ${activo ? 'bg-marca text-white' : 'bg-white text-gray-600 border border-gray-300'}`}
    >
      {children}
    </button>
  );
}

function PedidosDelDia() {
  const { usuario } = useAuth();
  const esAdmin = usuario?.rol === 'admin';
  const verTodos = esAdmin || esSoloLectura(usuario?.rol ?? 'vendedor');
  const sesion = leerSesion();
  const hoy = hoyISO();
  const [aEliminar, setAEliminar] = useState<Pedido | null>(null);
  const [aEditar, setAEditar] = useState<Pedido | null>(null);
  const [expandido, setExpandido] = useState<string | null>(null);

  // El admin ve TODOS los pedidos (para poder administrarlos); el vendedor,
  // solo los suyos tomados hoy. En ambos casos se excluyen los eliminados.
  const pedidos = useLiveQuery(async () => {
    const todos = (await db.pedidos.toArray()).filter((p) => !p.eliminado);
    const lista = verTodos
      ? todos
      : todos.filter((p) => p.vendedor === sesion?.vendedor && p.fecha_pedido.slice(0, 10) === hoy);
    return lista.sort((a, b) => b.fecha_pedido.localeCompare(a.fecha_pedido));
  }, [esAdmin, verTodos]) ?? [];

  async function eliminar(p: Pedido) {
    try { await eliminarPedido(p, usuario); toast('Pedido eliminado', 'success'); }
    catch (e) { toast((e as Error).message, 'error'); }
    finally { setAEliminar(null); }
  }

  if (pedidos.length === 0) {
    return <p className="p-8 text-center text-gray-400">{esAdmin ? 'No hay pedidos registrados.' : 'Aún no hay pedidos tomados hoy.'}</p>;
  }

  return (
    <div className="p-4 space-y-2">
      <p className="text-sm text-gray-500">{pedidos.length} pedido(s){esAdmin ? '' : ' hoy'}</p>
      {pedidos.map((p) => (
        <PedidoCard
          key={p.id}
          pedido={p}
          esAdmin={esAdmin}
          abierto={expandido === p.id}
          onToggle={() => setExpandido((cur) => (cur === p.id ? null : p.id))}
          onEliminar={() => setAEliminar(p)}
          onEditar={() => setAEditar(p)}
        />
      ))}

      {aEliminar && (
        <ConfirmModal
          titulo="Eliminar pedido"
          mensaje={<>¿Eliminar pedido de <b>{aEliminar.cliente_nombre}</b> por <b>{formatoMoneda(aEliminar.total_pedido)}</b>? Esta acción no se puede deshacer.</>}
          acciones={[{ texto: 'Eliminar definitivamente', tono: 'peligro', onClick: () => eliminar(aEliminar) }]}
          onCancelar={() => setAEliminar(null)}
        />
      )}

      {aEditar && <EditarPedido pedido={aEditar} onCerrar={() => setAEditar(null)} />}
    </div>
  );
}

function PedidoCard({
  pedido: p, esAdmin, abierto, onToggle, onEliminar, onEditar,
}: {
  pedido: Pedido; esAdmin: boolean; abierto: boolean;
  onToggle: () => void; onEliminar: () => void; onEditar: () => void;
}) {
  return (
    <div className="card overflow-hidden">
      {/* Encabezado: cualquier rol puede tocar para VER el detalle */}
      <button className="w-full p-3 text-left" onClick={onToggle}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-semibold truncate">{p.cliente_nombre}</p>
            <p className="text-xs text-gray-500">{p.lineas.length} producto(s) · entrega {fechaLegible(p.fecha_entrega)}</p>
            <p className="mt-1 flex items-center gap-1">
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${COLOR_ESTADO[p.estado_pedido] ?? 'bg-gray-100 text-gray-600'}`}>{p.estado_pedido}</span>
              {esAdmin && <span className="text-[11px] text-gray-400">{p.vendedor}</span>}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="font-bold text-green-600">{formatoMoneda(p.total_pedido)}</p>
            <p className="text-[11px] flex items-center justify-end gap-1">
              {p.sincronizado ? '🟢 Sincronizado' : '🟡 Pendiente'}
              {abierto ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </p>
          </div>
        </div>
      </button>

      {/* Detalle (solo lectura): productos, cantidades y precios */}
      {abierto && (
        <div className="px-3 pb-3 border-t border-gray-100 pt-2 space-y-2">
          <div className="rounded-lg bg-gray-50 divide-y divide-gray-100">
            {p.lineas.map((l) => (
              <div key={l.producto_codigo} className="flex justify-between p-2 text-sm">
                <span>{l.cantidad} × {l.producto_descripcion}</span>
                <span className="text-gray-500">{formatoMoneda(l.subtotal)}</span>
              </div>
            ))}
          </div>
          {p.notas && <p className="text-xs text-gray-500">Notas: {p.notas}</p>}

          {/* Editar/Eliminar: SOLO admin. El vendedor solo consulta. */}
          {esAdmin && (
            <div className="flex justify-end gap-2">
              <button className="btn-ghost !min-h-[36px] !px-3 text-xs" onClick={onEditar}>
                <Pencil size={14} /> Editar
              </button>
              <button className="text-red-500 flex items-center gap-1 text-xs font-medium px-3" onClick={onEliminar}>
                <Trash2 size={15} /> Eliminar
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const DIAS_HISTORIAL = 3;

// Pedidos ENTREGADOS cuya fecha de entrega cae dentro de los últimos
// DIAS_HISTORIAL días (hoy inclusive). Misma visibilidad que "Pedidos del
// día": vendedor ve solo los suyos, admin/lector ven todos.
function HistorialPedidos() {
  const { usuario } = useAuth();
  const esAdmin = usuario?.rol === 'admin';
  const verTodos = esAdmin || esSoloLectura(usuario?.rol ?? 'vendedor');
  const sesion = leerSesion();
  const [aEliminar, setAEliminar] = useState<Pedido | null>(null);
  const [aEditar, setAEditar] = useState<Pedido | null>(null);
  const [expandido, setExpandido] = useState<string | null>(null);

  const limite = new Date();
  limite.setDate(limite.getDate() - (DIAS_HISTORIAL - 1));
  const limiteISO = limite.toISOString().slice(0, 10);

  const pedidos = useLiveQuery(async () => {
    const todos = (await db.pedidos.toArray()).filter((p) => !p.eliminado);
    const entregados = todos.filter((p) =>
      (p.entregado === true || p.estado_pedido === 'Entregado') &&
      p.fecha_entrega.slice(0, 10) >= limiteISO);
    const lista = verTodos
      ? entregados
      : entregados.filter((p) => p.vendedor === sesion?.vendedor);
    return lista.sort((a, b) => b.fecha_entrega.localeCompare(a.fecha_entrega));
  }, [esAdmin, verTodos, limiteISO]) ?? [];

  async function eliminar(p: Pedido) {
    try { await eliminarPedido(p, usuario); toast('Pedido eliminado', 'success'); }
    catch (e) { toast((e as Error).message, 'error'); }
    finally { setAEliminar(null); }
  }

  if (pedidos.length === 0) {
    return <p className="p-8 text-center text-gray-400">No hay pedidos entregados en los últimos {DIAS_HISTORIAL} días.</p>;
  }

  return (
    <div className="p-4 space-y-2">
      <p className="text-sm text-gray-500">{pedidos.length} pedido(s) entregado(s) · últimos {DIAS_HISTORIAL} días</p>
      {pedidos.map((p) => (
        <PedidoCard
          key={p.id}
          pedido={p}
          esAdmin={esAdmin}
          abierto={expandido === p.id}
          onToggle={() => setExpandido((cur) => (cur === p.id ? null : p.id))}
          onEliminar={() => setAEliminar(p)}
          onEditar={() => setAEditar(p)}
        />
      ))}

      {aEliminar && (
        <ConfirmModal
          titulo="Eliminar pedido"
          mensaje={<>¿Eliminar pedido de <b>{aEliminar.cliente_nombre}</b> por <b>{formatoMoneda(aEliminar.total_pedido)}</b>? Esta acción no se puede deshacer.</>}
          acciones={[{ texto: 'Eliminar definitivamente', tono: 'peligro', onClick: () => eliminar(aEliminar) }]}
          onCancelar={() => setAEliminar(null)}
        />
      )}

      {aEditar && <EditarPedido pedido={aEditar} onCerrar={() => setAEditar(null)} />}
    </div>
  );
}
