import { NavLink } from 'react-router-dom';
import { Home, Users, ShoppingCart, Truck } from 'lucide-react';

// Barra de navegacion inferior con 4 pestañas (mobile-first).
const tabs = [
  { to: '/', label: 'Inicio', Icon: Home, end: true },
  { to: '/clientes', label: 'Clientes', Icon: Users, end: false },
  { to: '/pedidos', label: 'Pedidos', Icon: ShoppingCart, end: false },
  { to: '/despacho', label: 'Despacho', Icon: Truck, end: false },
];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 pb-[env(safe-area-inset-bottom)]">
      <div className="flex justify-around max-w-2xl mx-auto">
        {tabs.map(({ to, label, Icon, end }) => (
          <NavLink
            key={to}
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
        ))}
      </div>
    </nav>
  );
}
