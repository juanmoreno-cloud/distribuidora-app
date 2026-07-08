import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { FileText, Package, Lock, ChevronDown, ChevronUp } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import HeaderAcciones from '../components/HeaderAcciones';
import { db } from '../db/database';
import { RUTAS, type CargaItem, type Pedido, type Producto } from '../types';
import { mananaISO } from '../utils/formatters';
import { generarPdfCarga } from '../utils/pdfGenerator';
import { leerSesion } from '../hooks/useSession';
import { useAuth } from '../auth/AuthContext';
import { esSoloLectura } from '../auth/permisos';
import { toast } from '../components/Toast';

// Orden sugerido de carga: lo que va al fondo del camión primero.
const ORDEN_GRUPO: Record<string, number> = {
  CONGELADOS: 1, CARNICERIA: 2, CHARCUTERIA: 3, VIVERES: 4,
};
function ordenGrupo(g: string): number {
  return ORDEN_GRUPO[g.toUpperCase()] ?? 99;
}

export default function CargaPage() {
  const sesion = leerSesion();
  const { usuario } = useAuth();
  // Almacenista y despachador consultan; solo el admin edita.
  const soloLectura = usuario?.rol === 'almacenista' || usuario?.rol === 'despachador' || esSoloLectura(usuario?.rol ?? 'lector');
  const esAdmin = usuario?.rol === 'admin';
  const [fecha, setFecha] = useState(mananaISO());
  const [ruta, setRuta] = useState<string>(sesion?.ruta || RUTAS[0]);
  const [expandido, setExpandido] = useState<number | null>(null);

  const pedidos = useLiveQuery(() => db.pedidos.toArray(), []) ?? [];
  const productos = useLiveQuery(() => db.productos.toArray(), []) ?? [];

  // Agrupa los pedidos de esa fecha+ruta sumando cantidades por producto.
  // Además guarda el DESGLOSE por pedido, para que el admin edite desde aquí.
  interface DesglosePedido { pedidoId: string; cliente: string; cantidad: number }
  const { items, desglose } = useMemo(() => {
    const mapaProd = new Map<number, Producto>(productos.map((p) => [p.codigo, p]));
    const acc = new Map<number, CargaItem>();
    const des = new Map<number, DesglosePedido[]>();
    for (const ped of pedidos as Pedido[]) {
      if (ped.eliminado) continue;
      if (ped.fecha_entrega.slice(0, 10) !== fecha) continue;
      if (ped.ruta !== ruta) continue;
      if (ped.estado_pedido === 'Cancelado') continue;
      for (const l of ped.lineas) {
        const prev = acc.get(l.producto_codigo);
        const prod = mapaProd.get(l.producto_codigo);
        if (prev) {
          prev.cantidad_total += l.cantidad;
        } else {
          acc.set(l.producto_codigo, {
            fecha_entrega: fecha, ruta,
            producto_codigo: l.producto_codigo,
            producto_descripcion: l.producto_descripcion,
            grupo: prod?.grupo ?? '—',
            cantidad_total: l.cantidad,
            unidad: prod?.unidad ?? '',
          });
        }
        const lista = des.get(l.producto_codigo) ?? [];
        lista.push({ pedidoId: ped.id, cliente: ped.cliente_nombre, cantidad: l.cantidad });
        des.set(l.producto_codigo, lista);
      }
    }
    // Ordena por grupo (orden de carga) y luego por descripción.
    const ordenados = [...acc.values()].sort((a, b) =>
      ordenGrupo(a.grupo) - ordenGrupo(b.grupo) || a.producto_descripcion.localeCompare(b.producto_descripcion));
    return { items: ordenados, desglose: des };
  }, [pedidos, productos, fecha, ruta]);

  // Edición del admin: cambia la cantidad de ese producto EN el pedido real.
  // Cantidad 0 = quitar el producto del pedido. Carga/Despacho se recalculan solos.
  async function actualizarCantidad(pedidoId: string, codigo: number, cantidad: number) {
    const p = await db.pedidos.get(pedidoId);
    if (!p) return;
    let lineas = p.lineas;
    if (cantidad <= 0) {
      if (p.lineas.length <= 1) {
        toast('Es el único producto del pedido. Para quitarlo, elimina el pedido en Pedidos.', 'error');
        return;
      }
      lineas = p.lineas.filter((l) => l.producto_codigo !== codigo);
    } else {
      lineas = p.lineas.map((l) =>
        l.producto_codigo === codigo ? { ...l, cantidad, subtotal: cantidad * l.precio_unitario } : l);
    }
    const total = lineas.reduce((s, l) => s + l.subtotal, 0);
    await db.pedidos.update(pedidoId, { lineas, total_pedido: total, sincronizado: false, actualizado_en: new Date().toISOString() });
    toast('Pedido actualizado ✓', 'success');
  }

  function descargarPdf() {
    if (items.length === 0) { toast('No hay nada que cargar para esa fecha y ruta.', 'error'); return; }
    generarPdfCarga(items, fecha, ruta);
  }

  return (
    <div>
      <PageHeader titulo="Carga del Camión" accion={<HeaderAcciones />} />

      <div className="p-4 space-y-4 pb-24">
        {soloLectura && (
          <div className="card p-3 bg-blue-50 border-blue-200 flex items-center gap-2 text-blue-800 text-sm">
            <Lock size={18} /> Solo lectura. Contacta al admin para modificaciones.
          </div>
        )}

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

        {esAdmin && (
          <p className="text-xs text-gray-400">
            Toca un producto para ver de qué pedidos viene y <b>editar las cantidades aquí mismo</b>: los pedidos, la carga y el despacho se actualizan solos.
          </p>
        )}

        {items.length === 0 ? (
          <div className="card p-8 text-center text-gray-400">
            <Package size={36} className="mx-auto mb-2" />
            No hay pedidos para esta fecha y ruta.
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500">{items.length} producto(s) a cargar</p>
            <div className="card overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 text-xs">
                  <tr>
                    <th className="text-left p-2">Producto</th>
                    <th className="text-left p-2">Grupo</th>
                    <th className="text-right p-2">Cant.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.map((i) => (
                    <FilaCarga
                      key={i.producto_codigo}
                      item={i}
                      esAdmin={esAdmin}
                      abierto={expandido === i.producto_codigo}
                      onToggle={() => setExpandido((cur) => (cur === i.producto_codigo ? null : i.producto_codigo))}
                      desglose={desglose.get(i.producto_codigo) ?? []}
                      onActualizar={actualizarCantidad}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            <button className="btn-primary w-full" onClick={descargarPdf}>
              <FileText size={18} /> Generar PDF de Carga
            </button>
            <p className="text-xs text-gray-400 text-center">
              La lista ya viene ordenada para empacar: congelados primero, luego carnicería, charcutería y víveres.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

// Fila de la tabla de carga. Para el admin es expandible: muestra de qué
// pedidos viene la cantidad y permite editarla por pedido (onBlur guarda).
function FilaCarga({
  item: i, esAdmin, abierto, onToggle, desglose, onActualizar,
}: {
  item: CargaItem;
  esAdmin: boolean;
  abierto: boolean;
  onToggle: () => void;
  desglose: { pedidoId: string; cliente: string; cantidad: number }[];
  onActualizar: (pedidoId: string, codigo: number, cantidad: number) => void;
}) {
  return (
    <>
      <tr onClick={esAdmin ? onToggle : undefined} className={esAdmin ? 'cursor-pointer active:bg-gray-50' : ''}>
        <td className="p-2">
          <p className="font-medium flex items-center gap-1">
            {i.producto_descripcion}
            {esAdmin && (abierto ? <ChevronUp size={13} className="text-gray-400" /> : <ChevronDown size={13} className="text-gray-400" />)}
          </p>
          <p className="text-[11px] text-gray-400">#{i.producto_codigo} · {i.unidad}</p>
        </td>
        <td className="p-2 text-gray-500">{i.grupo}</td>
        <td className="p-2 text-right font-bold">{i.cantidad_total}</td>
      </tr>
      {esAdmin && abierto && (
        <tr>
          <td colSpan={3} className="p-2 bg-gray-50">
            <div className="space-y-1">
              {desglose.map((d) => (
                <div key={d.pedidoId} className="flex items-center justify-between gap-2 text-xs">
                  <span className="truncate text-gray-600">{d.cliente}</span>
                  <input
                    type="number" min={0} inputMode="numeric"
                    className="input !min-h-[36px] !px-1 w-16 text-right"
                    // key con la cantidad: si otro equipo la cambia, el input se refresca
                    key={`${d.pedidoId}-${d.cantidad}`}
                    defaultValue={d.cantidad}
                    onClick={(e) => e.stopPropagation()}
                    onBlur={(e) => {
                      const v = Math.max(0, Number(e.target.value) || 0);
                      if (v !== d.cantidad) onActualizar(d.pedidoId, i.producto_codigo, v);
                    }}
                  />
                </div>
              ))}
              <p className="text-[10px] text-gray-400">Cantidad 0 = quitar el producto de ese pedido.</p>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
