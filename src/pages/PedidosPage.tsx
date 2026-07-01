import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Trash2 } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import NuevoPedido from '../components/NuevoPedido';
import ConfirmModal from '../components/ConfirmModal';
import { db } from '../db/database';
import { formatoMoneda, fechaLegible, hoyISO } from '../utils/formatters';
import { leerSesion } from '../hooks/useSession';
import { useAuth } from '../auth/AuthContext';
import { toast } from '../components/Toast';
import { eliminarPedido } from '../services/borrado';
import type { Pedido } from '../types';

type Tab = 'nuevo' | 'dia';

export default function PedidosPage() {
  const [tab, setTab] = useState<Tab>('nuevo');

  return (
    <div>
      <PageHeader titulo="Pedidos" />
      <div className="flex gap-2 p-3 bg-gray-100 sticky top-[53px] z-20">
        <TabBtn activo={tab === 'nuevo'} onClick={() => setTab('nuevo')}>Nuevo pedido</TabBtn>
        <TabBtn activo={tab === 'dia'} onClick={() => setTab('dia')}>Pedidos del día</TabBtn>
      </div>

      {tab === 'nuevo' ? <NuevoPedido /> : <PedidosDelDia />}
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
  const sesion = leerSesion();
  const hoy = hoyISO();
  const [aEliminar, setAEliminar] = useState<Pedido | null>(null);

  // El admin ve TODOS los pedidos (para poder administrarlos); el vendedor,
  // solo los suyos tomados hoy. En ambos casos se excluyen los eliminados.
  const pedidos = useLiveQuery(async () => {
    const todos = (await db.pedidos.toArray()).filter((p) => !p.eliminado);
    const lista = esAdmin
      ? todos
      : todos.filter((p) => p.vendedor === sesion?.vendedor && p.fecha_pedido.slice(0, 10) === hoy);
    return lista.sort((a, b) => b.fecha_pedido.localeCompare(a.fecha_pedido));
  }, [esAdmin]) ?? [];

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
      {pedidos.map((p) => <PedidoCard key={p.id} pedido={p} esAdmin={esAdmin} onEliminar={() => setAEliminar(p)} />)}

      {aEliminar && (
        <ConfirmModal
          titulo="Eliminar pedido"
          mensaje={<>¿Eliminar pedido de <b>{aEliminar.cliente_nombre}</b> por <b>{formatoMoneda(aEliminar.total_pedido)}</b>? Esta acción no se puede deshacer.</>}
          acciones={[{ texto: 'Eliminar definitivamente', tono: 'peligro', onClick: () => eliminar(aEliminar) }]}
          onCancelar={() => setAEliminar(null)}
        />
      )}
    </div>
  );
}

function PedidoCard({ pedido: p, esAdmin, onEliminar }: { pedido: Pedido; esAdmin: boolean; onEliminar: () => void }) {
  return (
    <div className="card p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold truncate">{p.cliente_nombre}</p>
          <p className="text-xs text-gray-500">{p.lineas.length} producto(s) · entrega {fechaLegible(p.fecha_entrega)}</p>
          {esAdmin && <p className="text-[11px] text-gray-400">{p.vendedor}</p>}
        </div>
        <div className="text-right shrink-0">
          <p className="font-bold text-green-600">{formatoMoneda(p.total_pedido)}</p>
          <p className="text-[11px]">{p.sincronizado ? '🟢 Sincronizado' : '🟡 Pendiente'}</p>
        </div>
      </div>
      {esAdmin && (
        <div className="flex justify-end mt-2">
          <button className="text-red-500 flex items-center gap-1 text-xs font-medium p-1" onClick={onEliminar}>
            <Trash2 size={15} /> Eliminar
          </button>
        </div>
      )}
    </div>
  );
}
