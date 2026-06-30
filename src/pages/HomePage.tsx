import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, ShoppingCart, Truck, Package, LogOut, Settings } from 'lucide-react';
import { useSession, cerrarSesion } from '../hooks/useSession';
import SyncBadge from '../components/SyncBadge';
import ConfigPage from './ConfigPage';

// Pantalla de inicio: saludo + accesos directos a los modulos.
export default function HomePage() {
  const sesion = useSession();
  const [mostrarConfig, setMostrarConfig] = useState(false);

  const accesos = [
    { to: '/clientes', label: 'Clientes', desc: 'Registrar y ver clientes', Icon: Users, color: 'bg-blue-500' },
    { to: '/pedidos', label: 'Pedidos', desc: 'Tomar un nuevo pedido', Icon: ShoppingCart, color: 'bg-green-500' },
    { to: '/carga', label: 'Carga del Camión', desc: 'Resumen para el almacén', Icon: Package, color: 'bg-amber-500' },
    { to: '/despacho', label: 'Despacho', desc: 'Guías de entrega', Icon: Truck, color: 'bg-purple-500' },
  ];

  return (
    <div className="p-4">
      <header className="flex items-start justify-between mb-6">
        <div>
          <p className="text-sm text-gray-500">Hola,</p>
          <h1 className="text-xl font-bold">{sesion?.vendedor}</h1>
          <p className="text-sm text-marca font-medium">{sesion?.ruta}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <SyncBadge />
          <div className="flex gap-2">
            <button className="btn-ghost !min-h-[40px] !px-3 text-sm" onClick={() => setMostrarConfig(true)}>
              <Settings size={18} />
            </button>
            <button className="btn-ghost !min-h-[40px] text-sm" onClick={cerrarSesion}>
              <LogOut size={18} /> Salir
            </button>
          </div>
        </div>
      </header>

      {mostrarConfig && <ConfigPage onCerrar={() => setMostrarConfig(false)} />}

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
    </div>
  );
}
