import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import PageHeader from '../components/PageHeader';
import NuevoPedido from '../components/NuevoPedido';
import { db } from '../db/database';
import { formatoMoneda, fechaLegible, hoyISO } from '../utils/formatters';
import { leerSesion } from '../hooks/useSession';
import type { Pedido } from '../types';

type Tab = 'nuevo' | 'dia';

export default function PedidosPage() {
  const [tab, setTab] = useState<Tab>('nuevo');

  return (
    <div>
      <PageHeader titulo="Pedidos" />
      {/* Pestañas */}
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
  const sesion = leerSesion();
  // Pedidos tomados hoy por el vendedor logueado.
  const hoy = hoyISO();
  const pedidos = useLiveQuery(async () => {
    const todos = await db.pedidos.toArray();
    return todos
      .filter((p) => p.vendedor === sesion?.vendedor && p.fecha_pedido.slice(0, 10) === hoy)
      .sort((a, b) => b.fecha_pedido.localeCompare(a.fecha_pedido));
  }, []) ?? [];

  if (pedidos.length === 0) {
    return <p className="p-8 text-center text-gray-400">Aún no hay pedidos tomados hoy.</p>;
  }

  return (
    <div className="p-4 space-y-2">
      <p className="text-sm text-gray-500">{pedidos.length} pedido(s) hoy</p>
      {pedidos.map((p) => <PedidoCard key={p.id} pedido={p} />)}
    </div>
  );
}

function PedidoCard({ pedido: p }: { pedido: Pedido }) {
  return (
    <div className="card p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold truncate">{p.cliente_nombre}</p>
          <p className="text-xs text-gray-500">{p.lineas.length} producto(s) · entrega {fechaLegible(p.fecha_entrega)}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="font-bold text-green-600">{formatoMoneda(p.total_pedido)}</p>
          <p className="text-[11px]">{p.sincronizado ? '🟢 Sincronizado' : '🟡 Pendiente'}</p>
        </div>
      </div>
    </div>
  );
}
