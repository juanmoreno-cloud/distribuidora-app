import type { Rol } from '../types';

// Pestañas posibles de la barra inferior.
export type TabKey = 'inicio' | 'clientes' | 'pedidos' | 'carga' | 'despacho';

interface PermisoRol {
  rutaInicial: string;      // a dónde va tras iniciar sesión
  rutasPermitidas: string[]; // rutas que puede abrir
  tabs: TabKey[];           // pestañas visibles (ocultas, no deshabilitadas)
}

// Qué puede ver y hacer cada rol.
export const PERMISOS: Record<Rol, PermisoRol> = {
  vendedor: {
    rutaInicial: '/',
    rutasPermitidas: ['/', '/clientes', '/pedidos'],
    tabs: ['inicio', 'clientes', 'pedidos'],
  },
  despachador: {
    rutaInicial: '/despacho',
    // Puede consultar la carga del camión (solo lectura) además de despachar.
    rutasPermitidas: ['/despacho', '/carga'],
    tabs: ['carga', 'despacho'],
  },
  almacenista: {
    rutaInicial: '/carga',
    rutasPermitidas: ['/carga'],
    tabs: ['carga'],
  },
  inventario: {
    // Analista de Inventario: vive en el catálogo (productos, precios y stock).
    rutaInicial: '/catalogo',
    rutasPermitidas: ['/catalogo'],
    tabs: [],
  },
  admin: {
    rutaInicial: '/',
    rutasPermitidas: ['/', '/clientes', '/pedidos', '/carga', '/despacho', '/usuarios', '/papelera', '/catalogo'],
    // El admin supervisa TODO: los 5 módulos visibles en la barra.
    tabs: ['inicio', 'clientes', 'pedidos', 'carga', 'despacho'],
  },
};

// ¿El rol puede abrir esta ruta?
export function puedeAbrir(rol: Rol, ruta: string): boolean {
  return PERMISOS[rol].rutasPermitidas.includes(ruta);
}
