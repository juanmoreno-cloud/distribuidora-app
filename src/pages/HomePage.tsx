import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { Users, ShoppingCart, Truck, Package, Download, FileText } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { puedeAbrir } from '../auth/permisos';
import { ETIQUETA_ROL } from '../types';
import HeaderAcciones from '../components/HeaderAcciones';
import { db } from '../db/database';
import { generarPdfCatalogo, generarPdfClientesVendedor } from '../utils/pdfGenerator';
import { leerSesion } from '../hooks/useSession';

// Pantalla de inicio: saludo + accesos directos según el rol del usuario.
export default function HomePage() {
  const { usuario } = useAuth();
  const productos = useLiveQuery(() => db.productos.toArray(), []) ?? [];
  const clientes = useLiveQuery(() => db.clientes.toArray(), []) ?? [];
  if (!usuario) return null;

  const accesos = [
    { to: '/clientes', label: 'Clientes', desc: 'Registrar y ver clientes', Icon: Users, color: 'bg-blue-500' },
    { to: '/pedidos', label: 'Pedidos', desc: 'Tomar un nuevo pedido', Icon: ShoppingCart, color: 'bg-green-500' },
    { to: '/carga', label: 'Carga del Camión', desc: 'Resumen para el almacén', Icon: Package, color: 'bg-amber-500' },
    { to: '/despacho', label: 'Despacho', desc: 'Guías de entrega', Icon: Truck, color: 'bg-purple-500' },
  ].filter((a) => puedeAbrir(usuario.rol, a.to));

  return (
    <div className="p-4">
      <header className="flex items-start justify-between mb-6">
        <div>
          <p className="text-sm text-gray-500">Hola,</p>
          <h1 className="text-xl font-bold">{usuario.nombre_completo}</h1>
          <p className="text-sm text-marca font-medium">
            {ETIQUETA_ROL[usuario.rol]}{usuario.ruta_asignada ? ` · ${usuario.ruta_asignada}` : ''}
          </p>
        </div>
        <HeaderAcciones />
      </header>

      <div className="grid grid-cols-2 gap-3">
        {accesos.map(({ to, label, desc, Icon, color }) => (
          <Link key={to} to={to} className="card p-4 flex flex-col gap-3 active:scale-[0.98] transition">
            <div className={`${color} text-white rounded-xl w-11 h-11 flex items-center justify-center`}>
              <Icon size={22} />
            </div>
            <div>
              <p className="font-semibold">{label}</p>
              <p className="text-xs text-gray-500">{desc}</p>
            </div>
          </Link>
        ))}
      </div>

      {usuario.rol === 'vendedor' && (
        <div className="mt-3 space-y-2">
          <button
            className="btn-ghost w-full"
            onClick={() => generarPdfCatalogo(productos)}
          >
            <Download size={18} /> Catálogo e inventario (PDF)
          </button>
          <button
            className="btn-ghost w-full"
            onClick={() => {
              const sesion = leerSesion();
              const misClientes = clientes.filter((c) => !c.eliminado && c.vendedor_asignado === sesion?.vendedor);
              generarPdfClientesVendedor(misClientes, sesion?.vendedor ?? '');
            }}
          >
            <FileText size={18} /> Mis clientes (PDF)
          </button>
        </div>
      )}
    </div>
  );
}
