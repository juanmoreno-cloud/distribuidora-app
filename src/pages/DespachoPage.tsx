import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { ChevronDown, ChevronUp, FileText, Navigation, MapPin, Phone, CheckCircle2 } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { db } from '../db/database';
import { RUTAS, type Cliente, type Pedido } from '../types';
import { mananaISO, formatoMoneda } from '../utils/formatters';
import { ordenarPorProximidad } from '../utils/geo';
import { generarPdfDespacho } from '../utils/pdfGenerator';
import { leerSesion } from '../hooks/useSession';
import { toast } from '../components/Toast';

interface Parada {
  pedido: Pedido;
  cliente?: Cliente;
  latitud?: number;
  longitud?: number;
}

export default function DespachoPage() {
  const sesion = leerSesion();
  const [fecha, setFecha] = useState(mananaISO());
  const [ruta, setRuta] = useState<string>(sesion?.ruta || RUTAS[0]);
  const [porProximidad, setPorProximidad] = useState(false);
  const [expandido, setExpandido] = useState<string | null>(null);

  const pedidos = useLiveQuery(() => db.pedidos.toArray(), []) ?? [];
  const clientes = useLiveQuery(() => db.clientes.toArray(), []) ?? [];

  const paradas = useMemo<Parada[]>(() => {
    const mapaCli = new Map<string, Cliente>(clientes.map((c) => [c.id, c]));
    let lista: Parada[] = (pedidos as Pedido[])
      .filter((p) => p.fecha_entrega.slice(0, 10) === fecha && p.ruta === ruta && p.estado_pedido !== 'Cancelado')
      .map((p) => {
        const cli = mapaCli.get(p.cliente_id);
        return { pedido: p, cliente: cli, latitud: cli?.latitud, longitud: cli?.longitud };
      });

    if (porProximidad) {
      lista = ordenarPorProximidad(lista);
    } else {
      lista = lista.sort((a, b) => a.pedido.cliente_nombre.localeCompare(b.pedido.cliente_nombre));
    }
    return lista;
  }, [pedidos, clientes, fecha, ruta, porProximidad]);

  async function marcarEntregado(pedido: Pedido, entregado: boolean) {
    await db.pedidos.update(pedido.id, {
      entregado,
      estado_pedido: entregado ? 'Entregado' : 'Pendiente',
      sincronizado: false,
    });
  }

  async function guardarObs(pedido: Pedido, obs: string) {
    await db.pedidos.update(pedido.id, { obs_entrega: obs, sincronizado: false });
  }

  function descargarPdf() {
    if (paradas.length === 0) { toast('No hay entregas para esa fecha y ruta.', 'error'); return; }
    generarPdfDespacho(paradas.map((p) => p.pedido), fecha, ruta);
  }

  return (
    <div>
      <PageHeader titulo="Despacho" />

      <div className="p-4 space-y-4 pb-24">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Fecha de entrega</label>
            <input type="date" className="input" value={fecha} onChange={(e) => setFecha(e.target.value)} />
          </div>
          <div>
            <label className="label">Ruta</label>
            <select className="input" value={ruta} onChange={(e) => setRuta(e.target.value)}>
              {RUTAS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </div>

        {paradas.length === 0 ? (
          <div className="card p-8 text-center text-gray-400">No hay entregas para esta fecha y ruta.</div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">{paradas.length} entrega(s)</p>
              <button
                className={`btn-ghost !min-h-[38px] text-xs ${porProximidad ? '!bg-marca !text-white !border-marca' : ''}`}
                onClick={() => setPorProximidad((v) => !v)}
              >
                <Navigation size={15} /> {porProximidad ? 'Por proximidad' : 'Ordenar por proximidad'}
              </button>
            </div>

            <div className="space-y-2">
              {paradas.map((parada, i) => (
                <ParadaCard
                  key={parada.pedido.id}
                  numero={i + 1}
                  parada={parada}
                  abierto={expandido === parada.pedido.id}
                  onToggle={() => setExpandido((cur) => (cur === parada.pedido.id ? null : parada.pedido.id))}
                  onEntregado={marcarEntregado}
                  onObs={guardarObs}
                />
              ))}
            </div>

            <button className="btn-primary w-full" onClick={descargarPdf}>
              <FileText size={18} /> Generar PDF de Despacho
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function ParadaCard({
  numero, parada, abierto, onToggle, onEntregado, onObs,
}: {
  numero: number;
  parada: Parada;
  abierto: boolean;
  onToggle: () => void;
  onEntregado: (p: Pedido, v: boolean) => void;
  onObs: (p: Pedido, obs: string) => void;
}) {
  const { pedido: p, cliente } = parada;
  return (
    <div className={`card overflow-hidden ${p.entregado ? 'border-green-300 bg-green-50/40' : ''}`}>
      <button className="w-full p-3 flex items-center gap-3 text-left" onClick={onToggle}>
        <span className="bg-marca text-white rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold shrink-0">{numero}</span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold truncate flex items-center gap-1">
            {p.entregado && <CheckCircle2 size={16} className="text-green-600" />}
            {p.cliente_nombre}
          </p>
          <p className="text-xs text-gray-500">{p.lineas.length} producto(s) · {formatoMoneda(p.total_pedido)}</p>
        </div>
        {abierto ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>

      {abierto && (
        <div className="px-3 pb-3 space-y-3 border-t border-gray-100 pt-3">
          {cliente && (
            <div className="text-xs text-gray-600 space-y-1">
              {cliente.direccion && <p className="flex items-start gap-1"><MapPin size={13} className="mt-0.5 shrink-0" /> {cliente.direccion}</p>}
              {cliente.contacto_nombre && <p>👤 {cliente.contacto_nombre}</p>}
              {cliente.telefono && <p className="flex items-center gap-1"><Phone size={13} /> {cliente.telefono}</p>}
            </div>
          )}

          <div className="rounded-lg bg-gray-50 divide-y divide-gray-100">
            {p.lineas.map((l) => (
              <div key={l.producto_codigo} className="flex justify-between p-2 text-sm">
                <span>{l.cantidad} × {l.producto_descripcion}</span>
                <span className="text-gray-500">{formatoMoneda(l.subtotal)}</span>
              </div>
            ))}
          </div>

          <div className="flex justify-between font-semibold">
            <span>Total</span>
            <span className="text-green-600">{formatoMoneda(p.total_pedido)}</span>
          </div>

          <label className="flex items-center gap-2 select-none">
            <input
              type="checkbox"
              className="w-5 h-5 accent-green-600"
              checked={!!p.entregado}
              onChange={(e) => onEntregado(p, e.target.checked)}
            />
            <span className="font-medium">Entregado ✅</span>
          </label>

          <div>
            <label className="label">Observaciones de entrega</label>
            <textarea
              className="input min-h-[52px] py-2"
              defaultValue={p.obs_entrega ?? ''}
              placeholder="Cliente no estaba, rechazó producto, etc."
              onBlur={(e) => onObs(p, e.target.value)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
