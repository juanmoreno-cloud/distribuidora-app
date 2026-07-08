// ====================================================================
// Tipos del dominio. Una sola fuente de verdad para toda la app.
// Coinciden con las tablas de IndexedDB (Dexie) y con Google Sheets.
// ====================================================================

export const TIPOS_CLIENTE = [
  'Bodegas',
  'Abastos',
  'Supermercados',
  'Carnicería y frigorífico',
  'Charcutería',
  'Panadería Pastelería',
  'Cafetería Heladería',
  'Restaurantes Horecas',
  'Street Food',
  'Tascas',
  'Luncherías',
] as const;
export type TipoCliente = (typeof TIPOS_CLIENTE)[number];

export const ZONAS = [
  'Catia',
  'El Paraíso',
  'Quinta Crespo',
  '23 de Enero',
  'San Bernardino',
] as const;
export type Zona = (typeof ZONAS)[number];

export const ESTADOS_CLIENTE = ['Potencial', 'Activo', 'Rechazado', 'En negociación'] as const;
export type EstadoCliente = (typeof ESTADOS_CLIENTE)[number];

export const VENDEDORES = [
  'Vendedor A',
  'Vendedor B',
  'Vendedor C',
  'Vendedor D',
  'Vendedor E',
  'Vendedor F',
] as const;
export type Vendedor = (typeof VENDEDORES)[number];

export const RUTAS = [
  'Catia 1',
  'Catia 2',
  'El Paraíso 1',
  'El Paraíso 2',
  'Quinta Crespo 1',
  'Quinta Crespo 2',
] as const;
export type Ruta = (typeof RUTAS)[number];

export const TIPOS_PAGO = ['Contado', 'Crédito'] as const;
export type TipoPago = (typeof TIPOS_PAGO)[number];

export const ESTADOS_PEDIDO = [
  'Pendiente',
  'Procesado',
  'En ruta',
  'Entregado',
  'Cancelado',
] as const;
export type EstadoPedido = (typeof ESTADOS_PEDIDO)[number];

// -------------------- Cliente --------------------
export interface Cliente {
  id: string; // RIF o id auto-generado
  razon_social: string;
  nombre_fantasia: string;
  rif: string;
  tipo_documento?: 'RIF' | 'Cedula'; // tipo de documento del RIF/cédula; opcional para compatibilidad con clientes previos
  telefono: string;
  direccion: string;
  tipo_cliente: TipoCliente | '';
  zona: Zona | '';
  estado: EstadoCliente;
  latitud?: number;
  longitud?: number;
  contacto_nombre: string;
  contacto_telefono?: string; // teléfono del dueño/contacto, distinto al teléfono del negocio
  vendedor_asignado: string; // nombre del vendedor logueado (o dato heredado)
  ruta: Ruta | '';
  tipo_pago: TipoPago;
  limite_credito: number;
  observaciones: string;
  fecha_registro: string; // ISO
  sincronizado: boolean;
  actualizado_en?: string; // ISO de la última modificación local; resuelve conflictos de sincronización (gana el más reciente)
  fotos_soportes: string[]; // base64 (offline; luego se suben)
  eliminado?: boolean; // borrado suave (solo admin); se oculta de las vistas
}

// -------------------- Producto --------------------
export interface Producto {
  codigo: number;
  descripcion: string;
  grupo: string;
  sub_grupo: string;
  precio_unitario: number;
  unidad: string;
  stock?: number;          // inventario disponible (lo administra el admin)
  sincronizado?: boolean;  // false = precio/stock editado localmente, pendiente de subir
}

// -------------------- Pedido --------------------
export interface LineaPedido {
  producto_codigo: number;
  producto_descripcion: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

export interface Pedido {
  id: string; // UUID
  fecha_pedido: string; // ISO
  fecha_entrega: string; // ISO
  vendedor: string;
  ruta: string;
  cliente_id: string;
  cliente_nombre: string; // denormalizado para offline
  tipo_pago: TipoPago;
  estado_pedido: EstadoPedido;
  lineas: LineaPedido[];
  total_pedido: number;
  notas: string;
  sincronizado: boolean;
  actualizado_en?: string; // ISO de la última modificación local; resuelve conflictos de sincronización (gana el más reciente)
  sheet_row_id?: number;
  // Campos de despacho (se llenan en el modulo de Despacho)
  entregado?: boolean;
  obs_entrega?: string;
  eliminado?: boolean; // borrado suave (solo admin); se oculta de las vistas
}

// -------------------- Carga del camion (derivada) --------------------
export interface CargaItem {
  fecha_entrega: string;
  ruta: string;
  producto_codigo: number;
  producto_descripcion: string;
  grupo: string;
  cantidad_total: number;
  unidad: string;
}

// -------------------- Configuracion (clave/valor) --------------------
export interface ConfigItem {
  clave: string;
  valor: unknown;
}

// -------------------- Sesion derivada (para módulos existentes) --------------------
export interface Sesion {
  vendedor: string;   // nombre del usuario logueado
  ruta: string;       // ruta asignada (vacío si el rol no tiene ruta)
}

// -------------------- Usuarios y roles --------------------
export const ROLES = ['vendedor', 'despachador', 'almacenista', 'inventario', 'admin', 'lector'] as const;
export type Rol = (typeof ROLES)[number];

export const ETIQUETA_ROL: Record<Rol, string> = {
  vendedor: 'Vendedor',
  despachador: 'Despachador',
  almacenista: 'Almacenista',
  inventario: 'Analista de Inventario',
  admin: 'Administrador',
  lector: 'Lector (solo lectura)',
};

export interface Usuario {
  id: string;
  username: string;
  password: string;          // hash bcrypt (nunca texto plano)
  nombre_completo: string;
  rol: Rol;
  ruta_asignada?: string;    // solo vendedores
  activo: boolean;
  fecha_creacion: string;
  creado_por: string;
  debe_cambiar_clave: boolean;
}

// Sesión guardada en localStorage tras iniciar sesión.
export interface SesionAuth {
  usuario: string;   // username
  rol: Rol;
  nombre: string;    // nombre_completo
  ruta_asignada?: string;
  timestamp: number; // para expiración por inactividad
}
