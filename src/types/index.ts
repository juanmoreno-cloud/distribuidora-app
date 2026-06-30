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
  '23 de Enero',
  'Alta Vista',
  'El Cementerio',
  'La Vega',
  'El Rosal',
  'Chacao',
  'Los Ruices',
  'Sabana Grande',
  'Plaza Venezuela',
  'Petare',
  'Los Dos Caminos',
  'Boleíta',
  'La Castellana',
  'San Bernardino',
  'Catia',
  'El Paraíso',
  'Antímano',
  'Otro',
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
  'Ruta 1 (Zona Oeste/Norte)',
  'Ruta 2 (Zona Centro/Sur)',
  'Ruta 3 (Zona Este)',
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
  telefono: string;
  direccion: string;
  tipo_cliente: TipoCliente | '';
  zona: Zona | '';
  estado: EstadoCliente;
  latitud?: number;
  longitud?: number;
  contacto_nombre: string;
  vendedor_asignado: Vendedor | '';
  ruta: Ruta | '';
  tipo_pago: TipoPago;
  limite_credito: number;
  observaciones: string;
  fecha_registro: string; // ISO
  sincronizado: boolean;
  fotos_soportes: string[]; // base64 (offline; luego se suben)
}

// -------------------- Producto --------------------
export interface Producto {
  codigo: number;
  descripcion: string;
  grupo: string;
  sub_grupo: string;
  precio_unitario: number;
  unidad: string;
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
  sheet_row_id?: number;
  // Campos de despacho (se llenan en el modulo de Despacho)
  entregado?: boolean;
  obs_entrega?: string;
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

// -------------------- Sesion del vendedor (localStorage) --------------------
export interface Sesion {
  vendedor: Vendedor;
  ruta: Ruta;
}
