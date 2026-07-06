import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Plus, Search, MapPin, CloudOff, Trash2, CreditCard, X } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import ClienteForm from '../components/ClienteForm';
import ConfirmModal from '../components/ConfirmModal';
import { db } from '../db/database';
import { TIPOS_PAGO, type Cliente, type TipoPago } from '../types';
import { useAuth } from '../auth/AuthContext';
import { toast } from '../components/Toast';
import { contarPedidosDeCliente, eliminarCliente, eliminarClienteConPedidos } from '../services/borrado';

// Módulo de Clientes: lista + búsqueda + registro de nuevos (offline).
export default function ClientesPage() {
  const { usuario } = useAuth();
  const esAdmin = usuario?.rol === 'admin';
  const [mostrarForm, setMostrarForm] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [aEliminar, setAEliminar] = useState<Cliente | null>(null);
  const [aEditarCredito, setAEditarCredito] = useState<Cliente | null>(null);
  const [pedidosAsociados, setPedidosAsociados] = useState(0);

  // Solo clientes NO eliminados.
  const clientes = (useLiveQuery(() => db.clientes.toArray(), []) ?? []).filter((c) => !c.eliminado);
  const pendientes = clientes.filter((c) => !c.sincronizado);

  const q = busqueda.trim().toLowerCase();
  const filtrados = q
    ? clientes.filter((c) =>
        c.nombre_fantasia.toLowerCase().includes(q) ||
        c.razon_social.toLowerCase().includes(q) ||
        c.rif.toLowerCase().includes(q))
    : clientes;

  async function pedirEliminar(c: Cliente) {
    setPedidosAsociados(await contarPedidosDeCliente(c.id));
    setAEliminar(c);
  }

  async function hacer(fn: () => Promise<void>, msg: string) {
    try { await fn(); toast(msg, 'success'); }
    catch (e) { toast((e as Error).message, 'error'); }
    finally { setAEliminar(null); }
  }

  return (
    <div>
      <PageHeader
        titulo="Clientes"
        accion={
          <button className="btn-primary !min-h-[40px] text-sm" onClick={() => setMostrarForm(true)}>
            <Plus size={18} /> Nuevo Cliente
          </button>
        }
      />

      <div className="p-4 space-y-4">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input pl-10" placeholder="Buscar por nombre o RIF…" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
        </div>

        {pendientes.length > 0 && (
          <div className="card p-3 bg-amber-50 border-amber-200 flex items-center gap-2 text-amber-800 text-sm">
            <CloudOff size={18} />
            {pendientes.length} cliente(s) pendiente(s) de sincronizar. Se subirán cuando haya internet.
          </div>
        )}

        <p className="text-sm text-gray-500">{filtrados.length} cliente(s)</p>

        <div className="space-y-2">
          {filtrados.map((c) => (
            <ClienteCard key={c.id} cliente={c} esAdmin={esAdmin} onEliminar={() => pedirEliminar(c)} onCredito={() => setAEditarCredito(c)} />
          ))}
          {filtrados.length === 0 && <p className="text-center text-gray-400 py-8">No hay clientes que coincidan.</p>}
        </div>
      </div>

      {mostrarForm && <ClienteForm onCerrar={() => setMostrarForm(false)} />}

      {aEditarCredito && <EditarCredito cliente={aEditarCredito} onCerrar={() => setAEditarCredito(null)} />}

      {aEliminar && (
        <ConfirmModal
          titulo="Eliminar cliente"
          mensaje={
            pedidosAsociados > 0
              ? <>Este cliente tiene <b>{pedidosAsociados}</b> pedido(s) asociado(s). ¿Eliminar solo el cliente o también sus pedidos?<br /><span className="text-xs text-gray-400">Esta acción no se puede deshacer.</span></>
              : <>¿Estás seguro de eliminar a <b>{aEliminar.nombre_fantasia || aEliminar.razon_social}</b>? Esta acción no se puede deshacer.</>
          }
          acciones={
            pedidosAsociados > 0
              ? [
                  { texto: 'Cliente y pedidos', tono: 'peligro', onClick: () => hacer(() => eliminarClienteConPedidos(aEliminar, usuario), 'Cliente y pedidos eliminados') },
                  { texto: 'Solo cliente', tono: 'neutro', onClick: () => hacer(() => eliminarCliente(aEliminar, usuario), 'Cliente eliminado') },
                ]
              : [
                  { texto: 'Eliminar definitivamente', tono: 'peligro', onClick: () => hacer(() => eliminarCliente(aEliminar, usuario), 'Cliente eliminado') },
                ]
          }
          onCancelar={() => setAEliminar(null)}
        />
      )}
    </div>
  );
}

// Mini-modal (SOLO admin) para editar el tipo de pago y el límite de crédito
// de un cliente existente. Con la sincronización, el cambio baja a los demás equipos.
function EditarCredito({ cliente: c, onCerrar }: { cliente: Cliente; onCerrar: () => void }) {
  const [tipoPago, setTipoPago] = useState<TipoPago>(c.tipo_pago);
  const [limite, setLimite] = useState(String(c.limite_credito));

  async function guardar() {
    const lim = tipoPago === 'Crédito' ? Math.max(0, Number(limite) || 0) : 0;
    await db.clientes.update(c.id, { tipo_pago: tipoPago, limite_credito: lim, sincronizado: false, actualizado_en: new Date().toISOString() });
    toast('Crédito actualizado ✓', 'success');
    onCerrar();
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4" onClick={onCerrar}>
      <div className="card w-full max-w-sm p-5 space-y-3" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-bold">Crédito de {c.nombre_fantasia || c.razon_social}</h3>
          <button className="p-1 text-gray-500" onClick={onCerrar}><X size={18} /></button>
        </div>
        <div>
          <label className="label">Tipo de pago</label>
          <select className="input" value={tipoPago} onChange={(e) => setTipoPago(e.target.value as TipoPago)}>
            {TIPOS_PAGO.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        {tipoPago === 'Crédito' && (
          <div>
            <label className="label">Límite de crédito ($)</label>
            <input className="input" type="number" inputMode="decimal" min="0" value={limite} onChange={(e) => setLimite(e.target.value)} />
          </div>
        )}
        <button className="btn-success w-full" onClick={guardar}>Guardar</button>
      </div>
    </div>
  );
}

function ClienteCard({ cliente: c, esAdmin, onEliminar, onCredito }: { cliente: Cliente; esAdmin: boolean; onEliminar: () => void; onCredito: () => void }) {
  return (
    <div className="card p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold truncate">{c.nombre_fantasia || c.razon_social}</p>
          <p className="text-xs text-gray-500">{c.rif} · {c.tipo_cliente || 'Sin tipo'}</p>
          {c.direccion && <p className="text-xs text-gray-500 truncate">{c.direccion}</p>}
          {c.contacto_nombre && <p className="text-xs text-gray-500">👤 {c.contacto_nombre}{c.contacto_telefono ? ` · ${c.contacto_telefono}` : ''}</p>}
          {c.telefono && <p className="text-xs text-gray-500">📞 {c.telefono} (negocio)</p>}
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className={`text-[10px] px-2 py-0.5 rounded-full ${badgeEstado(c.estado)}`}>{c.estado}</span>
          <span className="text-[10px] text-gray-400">{c.tipo_pago}</span>
        </div>
      </div>
      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-3 text-[11px] text-gray-400">
          {c.latitud && <span className="flex items-center gap-1"><MapPin size={12} /> GPS</span>}
          <span>{c.sincronizado ? '🟢 Sincronizado' : '🟡 Pendiente'}</span>
        </div>
        {/* Crédito y Eliminar: SOLO admin */}
        {esAdmin && (
          <div className="flex items-center gap-2">
            <button className="text-marca flex items-center gap-1 text-xs font-medium p-1" onClick={onCredito}>
              <CreditCard size={15} /> Crédito
            </button>
            <button className="text-red-500 flex items-center gap-1 text-xs font-medium p-1" onClick={onEliminar}>
              <Trash2 size={15} /> Eliminar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function badgeEstado(estado: string): string {
  switch (estado) {
    case 'Activo': return 'bg-green-100 text-green-700';
    case 'En negociación': return 'bg-amber-100 text-amber-700';
    case 'Rechazado': return 'bg-red-100 text-red-700';
    default: return 'bg-gray-100 text-gray-600';
  }
}
