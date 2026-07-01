import { NavLink } from 'react-router-dom';
import { Home, Users, ShoppingCart, Truck, Package } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { PERMISOS, type TabKey } from '../auth/permisos';

// Definición de cada pestaña posible.
const TABS: Record<TabKey, { to: string; label: string; Icon: typeof Home; end: boolean }> = {
  inicio: { to: '/', label: 'Inicio', Icon: Home, end: true },
  clientes: { to: '/clientes', label: 'Clientes', Icon: Users, end: false },
  pedidos: { to: '/pedidos', label: 'Pedidos', Icon: ShoppingCart, end: false },
  carga: { to: '/carga', label: 'Carga', Icon: Package, end: false },
  despacho: { to: '/despacho', label: 'Despacho', Icon: Truck, end: false },
};

// Barra inferior: muestra SOLO las pestañas que el rol puede ver.
export default function BottomNav() {
  const { usuario } = useAuth();
  if (!usuario) return null;
  const tabs = PERMISOS[usuario.rol].tabs;
  // Con una sola pestaña no tiene sentido mostrar la barra.
  if (tabs.length <= 1) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 pb-[env(safe-area-inset-bottom)]">
      <div className="flex justify-around max-w-2xl mx-auto">
        {tabs.map((key) => {
          const { to, label, Icon, end } = TABS[key];
          return (
            <NavLink
              key={key}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-1 flex-1 min-h-[60px] text-xs ${
                  isActive ? 'text-marca font-semibold' : 'text-gray-500'
                }`
              }
            >
              <Icon size={24} />
              {label}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
