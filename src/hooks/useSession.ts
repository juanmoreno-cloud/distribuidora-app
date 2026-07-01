import { useEffect, useState } from 'react';
import type { Sesion, SesionAuth } from '../types';

// Compatibilidad para los módulos existentes (Pedidos, Clientes, Carga, Despacho):
// deriva { vendedor, ruta } de la sesión de autenticación real.
const CLAVE_AUTH = 'distribuidora_auth';

function leerAuth(): SesionAuth | null {
  try { return JSON.parse(localStorage.getItem(CLAVE_AUTH) || '') as SesionAuth; }
  catch { return null; }
}

// Devuelve { vendedor, ruta } del usuario logueado (o null si no hay sesión).
export function leerSesion(): Sesion | null {
  const a = leerAuth();
  if (!a) return null;
  return { vendedor: a.nombre, ruta: a.ruta_asignada ?? '' };
}

// Hook reactivo equivalente, para componentes.
export function useSession(): Sesion | null {
  const [sesion, setSesion] = useState<Sesion | null>(leerSesion);
  useEffect(() => {
    const handler = () => setSesion(leerSesion());
    window.addEventListener('auth-cambiada', handler);
    window.addEventListener('storage', handler);
    return () => {
      window.removeEventListener('auth-cambiada', handler);
      window.removeEventListener('storage', handler);
    };
  }, []);
  return sesion;
}
