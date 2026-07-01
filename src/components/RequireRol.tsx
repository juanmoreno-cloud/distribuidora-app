import { Navigate, useLocation } from 'react-router-dom';
import { type ReactNode } from 'react';
import { useAuth } from '../auth/AuthContext';
import { PERMISOS, puedeAbrir } from '../auth/permisos';

// Si el usuario abre una ruta que no corresponde a su rol, lo manda a su inicio.
export default function RequireRol({ children }: { children: ReactNode }) {
  const { usuario } = useAuth();
  const location = useLocation();
  if (!usuario) return <Navigate to="/" replace />;
  if (!puedeAbrir(usuario.rol, location.pathname)) {
    return <Navigate to={PERMISOS[usuario.rol].rutaInicial} replace />;
  }
  return <>{children}</>;
}
