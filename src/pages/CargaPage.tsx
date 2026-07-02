import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { FileText, Package, Lock } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import HeaderAcciones from '../components/HeaderAcciones';
import { db } from '../db/database';
import { RUTAS, type CargaItem, type Pedido, type Producto } from '../types';
import { mananaISO } from '../utils/formatters';
import { generarPdfCarga } from '../utils/pdfGenerator';
import { leerSesion } from '../hooks/useSession';
import { useAuth } from '../auth/AuthContext';
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
  const soloLectura = usuario?.rol === 'almacenista';
  const esAdmin = usuario?.rol === 'admin';
  const [fecha, setFecha] = useState(mananaISO());
  const [ruta, setRuta] = useState<string>(sesion?.ruta || RUTAS[0]);

  const pedidos = useLiveQuery(() => db.pedidos.toArray(), []) ?? [];
  const productos = useLiveQuery(() => db.productos.toArray(), []) ?? [];

  // Agrupa los pedidos de esa fecha+ruta sumando cantidades por producto.
  const items = useMemo<CargaItem[]>(() => {
    const mapaProd = new Map<number, Producto>(productos.map((p) => [p.codigo, p]));
    const acc = new Map<number, CargaItem>();
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
      }
    }
    // Ordena por grupo (orden de carga) y luego por descripción.
    return [...acc.values()].sort((a, b) =>
      ordenGrupo(a.grupo) - ordenGrupo(b.grupo) || a.producto_descripcion.localeCompare(b.producto_descripcion));
  }, [pedidos, productos, fecha, ruta]);

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
            Para cambiar cantidades, edita el pedido en <b>Pedidos</b>: la carga y el despacho se actualizan solos.
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
                    <tr key={i.producto_codigo}>
                      <td className="p-2">
                        <p className="font-medium">{i.producto_descripcion}</p>
                        <p className="text-[11px] text-gray-400">#{i.producto_codigo} · {i.unidad}</p>
                      </td>
                      <td className="p-2 text-gray-500">{i.grupo}</td>
                      <td className="p-2 text-right font-bold">{i.cantidad_total}</td>
                    </tr>
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
