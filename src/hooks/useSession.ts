import { useEffect, useState } from 'react';
import type { Sesion } from '../types';

const CLAVE = 'distribuidora_sesion';

// Lee la sesion (vendedor + ruta) guardada en localStorage.
export function leerSesion(): Sesion | null {
  try {
    const raw = localStorage.getItem(CLAVE);
    return raw ? (JSON.parse(raw) as Sesion) : null;
  } catch {
    return null;
  }
}

export function guardarSesion(s: Sesion): void {
  localStorage.setItem(CLAVE, JSON.stringify(s));
  window.dispatchEvent(new Event('sesion-cambiada'));
}

export function cerrarSesion(): void {
  localStorage.removeItem(CLAVE);
  window.dispatchEvent(new Event('sesion-cambiada'));
}

// Hook reactivo: la app se entera cuando inicia o cierra la jornada.
export function useSession(): Sesion | null {
  const [sesion, setSesion] = useState<Sesion | null>(leerSesion);
  useEffect(() => {
    const handler = () => setSesion(leerSesion());
    window.addEventListener('sesion-cambiada', handler);
    window.addEventListener('storage', handler);
    return () => {
      window.removeEventListener('sesion-cambiada', handler);
      window.removeEventListener('storage', handler);
    };
  }, []);
  return sesion;
}
