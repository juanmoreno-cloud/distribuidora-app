import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { ArrowLeft, RotateCcw, Trash2 } from 'lucide-react';
import { db } from '../db/database';
import type { Cliente, Pedido } from '../types';
import { useAuth } from '../auth/AuthContext';
import { esSoloLectura } from '../auth/permisos';
import { toast } from '../components/Toast';
import ConfirmModal from '../components/ConfirmModal';
import { formatoMoneda } from '../utils/formatters';
import {
  restaurarCliente, restaurarPedido, eliminarClienteDefinitivo, eliminarPedidoDefinitivo,
} from '../services/borrado';

// Papelera (solo admin): registros marcados como eliminados.
export default function PapeleraPage() {
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const soloLectura = esSoloLectura(usuario?.rol ?? 'lector');
  const [aBorrar, setABorrar] = useState<{ tipo: 'cliente' | 'pedido'; item: Cliente | Pedido } | null>(null);

  const clientes = (useLiveQuery(() => db.clientes.toArray(), []) ?? []).filter((c) => c.eliminado);
  const pedidos = (useLiveQuery(() => db.pedidos.toArray(), []) ?? []).filter((p) => p.eliminado);

  async function hacer(fn: () => Promise<void>, msg: string) {
    try { await fn(); toast(msg, 'success'); }
    catch (e) { toast((e as Error).message, 'error'); }
    finally { setABorrar(null); }
  }

  const vacia = clientes.length === 0 && pedidos.length === 0;

  return (
    <div>
      <header className="sticky top-0 z-30 bg-gray-100/95 backdrop-blur px-4 py-3 flex items-center gap-2 border-b border-gray-200">
        <button className="btn-ghost !min-h-[40px] !px-3" onClick={() => navigate('/')}><ArrowLeft size={18} /></button>
        <h1 className="text-lg font-bold">Papelera</h1>
      </header>

      <div className="p-4 space-y-4 pb-24">
        {vacia && <p className="text-center text-gray-400 py-10">La papelera está vacía.</p>}

        {clientes.length > 0 && (
          <section className="space-y-2">
            <p className="text-sm font-semibold text-gray-700">Clientes eliminados ({clientes.length})</p>
            {clientes.map((c) => (
              <div key={c.id} className="card p-3">
                <p className="font-medium">{c.nombre_fantasia || c.razon_social}</p>
                <p className="text-xs text-gray-500">{c.rif}</p>
                {!soloLectura && (
                  <div className="flex gap-2 mt-2">
                    <button className="btn-ghost !min-h-[36px] text-xs flex-1" onClick={() => hacer(() => restaurarCliente(c, usuario), 'Cliente restaurado')}>
                      <RotateCcw size={14} /> Restaurar
                    </button>
                    <button className="btn !min-h-[36px] text-xs flex-1 bg-red-600 text-white" onClick={() => setABorrar({ tipo: 'cliente', item: c })}>
                      <Trash2 size={14} /> Eliminar definitivo
                    </button>
                  </div>
                )}
              </div>
            ))}
          </section>
        )}

        {pedidos.length > 0 && (
          <section className="space-y-2">
            <p className="text-sm font-semibold text-gray-700">Pedidos eliminados ({pedidos.length})</p>
            {pedidos.map((p) => (
              <div key={p.id} className="card p-3">
                <p className="font-medium">{p.cliente_nombre}</p>
                <p className="text-xs text-gray-500">{formatoMoneda(p.total_pedido)} · {p.lineas.length} producto(s)</p>
                {!soloLectura && (
                  <div className="flex gap-2 mt-2">
                    <button className="btn-ghost !min-h-[36px] text-xs flex-1" onClick={() => hacer(() => restaurarPedido(p, usuario), 'Pedido restaurado')}>
                      <RotateCcw size={14} /> Restaurar
                    </button>
                    <button className="btn !min-h-[36px] text-xs flex-1 bg-red-600 text-white" onClick={() => setABorrar({ tipo: 'pedido', item: p })}>
                      <Trash2 size={14} /> Eliminar definitivo
                    </button>
                  </div>
                )}
              </div>
            ))}
          </section>
        )}
      </div>

      {aBorrar && (
        <ConfirmModal
          titulo="Eliminar definitivamente"
          mensaje="Se borrará por completo de este dispositivo y no se podrá restaurar. Esta acción no se puede deshacer."
          acciones={[{
            texto: 'Eliminar para siempre', tono: 'peligro',
            onClick: () => aBorrar.tipo === 'cliente'
              ? hacer(() => eliminarClienteDefinitivo(aBorrar.item as Cliente, usuario), 'Eliminado definitivamente')
              : hacer(() => eliminarPedidoDefinitivo(aBorrar.item as Pedido, usuario), 'Eliminado definitivamente'),
          }]}
          onCancelar={() => setABorrar(null)}
        />
      )}
    </div>
  );
}
