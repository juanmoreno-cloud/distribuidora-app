import type { Cliente } from '../types';

// ====================================================================
// 8 clientes de ejemplo para que la app no este vacia al iniciar.
// Se cargan solo en el primer arranque (si la tabla esta vacia).
// ====================================================================
export const CLIENTES_SEED: Cliente[] = [
  {
    id: 'J-12345678-9', razon_social: 'PANADERIA LAS DUEÑAS', nombre_fantasia: 'Panaderia Las Dueñas',
    rif: 'J-12345678-9', telefono: '0412-1234567', direccion: '23 de Enero, cerca del Hospital del Oeste',
    tipo_cliente: 'Panadería Pastelería', zona: '23 de Enero', estado: 'Potencial', tipo_pago: 'Contado',
    vendedor_asignado: 'Vendedor A', ruta: 'Ruta 1 (Zona Oeste/Norte)', latitud: 10.520827, longitud: -66.941768,
    contacto_nombre: 'María Dueñas', limite_credito: 0, observaciones: '', fecha_registro: '2026-01-01T00:00:00.000Z',
    sincronizado: true, fotos_soportes: [],
  },
  {
    id: 'J-87654321-0', razon_social: 'AVEIRO PAN', nombre_fantasia: 'Aveiro Pan',
    rif: 'J-87654321-0', telefono: '0414-9876543', direccion: '23 de Enero, Av. Principal',
    tipo_cliente: 'Panadería Pastelería', zona: '23 de Enero', estado: 'Potencial', tipo_pago: 'Contado',
    vendedor_asignado: 'Vendedor A', ruta: 'Ruta 1 (Zona Oeste/Norte)', latitud: 10.522765, longitud: -66.941823,
    contacto_nombre: 'Luis Aveiro', limite_credito: 0, observaciones: '', fecha_registro: '2026-01-01T00:00:00.000Z',
    sincronizado: true, fotos_soportes: [],
  },
  {
    id: 'J-11223344-5', razon_social: 'ACARAMELADOS ALTA VISTA', nombre_fantasia: 'Acaramelados Alta Vista',
    rif: 'J-11223344-5', telefono: '0424-5556677', direccion: 'Alta Vista, edificio rojo',
    tipo_cliente: 'Panadería Pastelería', zona: 'Alta Vista', estado: 'En negociación', tipo_pago: 'Crédito',
    vendedor_asignado: 'Vendedor B', ruta: 'Ruta 1 (Zona Oeste/Norte)', latitud: 10.521924, longitud: -66.942116,
    contacto_nombre: 'Pedro Caramel', limite_credito: 500, observaciones: '', fecha_registro: '2026-01-01T00:00:00.000Z',
    sincronizado: true, fotos_soportes: [],
  },
  {
    id: 'V-12345678', razon_social: 'LOS RIZO', nombre_fantasia: 'Los Rizo',
    rif: 'V-12345678', telefono: '0412-3334444', direccion: '23 de Enero, esquina de la panadería',
    tipo_cliente: 'Street Food', zona: '23 de Enero', estado: 'Potencial', tipo_pago: 'Contado',
    vendedor_asignado: 'Vendedor B', ruta: 'Ruta 1 (Zona Oeste/Norte)', latitud: 10.521415, longitud: -66.940521,
    contacto_nombre: 'Rizo Rizo', limite_credito: 0, observaciones: '', fecha_registro: '2026-01-01T00:00:00.000Z',
    sincronizado: true, fotos_soportes: [],
  },
  {
    id: 'J-55667788-9', razon_social: 'CARNICERIA EL CEMENTERIO', nombre_fantasia: 'Carnicería El Cementerio',
    rif: 'J-55667788-9', telefono: '0212-4445555', direccion: 'El Cementerio, calle 5',
    tipo_cliente: 'Carnicería y frigorífico', zona: 'El Cementerio', estado: 'Activo', tipo_pago: 'Crédito',
    vendedor_asignado: 'Vendedor C', ruta: 'Ruta 2 (Zona Centro/Sur)', latitud: 10.51, longitud: -66.92,
    contacto_nombre: 'José Carnes', limite_credito: 500, observaciones: '', fecha_registro: '2026-01-01T00:00:00.000Z',
    sincronizado: true, fotos_soportes: [],
  },
  {
    id: 'J-99887766-5', razon_social: 'BODEGA LA VEGA', nombre_fantasia: 'Bodega La Vega',
    rif: 'J-99887766-5', telefono: '0416-7778888', direccion: 'La Vega, local 12',
    tipo_cliente: 'Bodegas', zona: 'La Vega', estado: 'Potencial', tipo_pago: 'Contado',
    vendedor_asignado: 'Vendedor D', ruta: 'Ruta 2 (Zona Centro/Sur)', latitud: 10.505, longitud: -66.915,
    contacto_nombre: 'Ana Vega', limite_credito: 0, observaciones: '', fecha_registro: '2026-01-01T00:00:00.000Z',
    sincronizado: true, fotos_soportes: [],
  },
  {
    id: 'J-33445566-7', razon_social: 'CAFETERIA CHACAO', nombre_fantasia: 'Cafetería Chacao',
    rif: 'J-33445566-7', telefono: '0412-9990000', direccion: 'Chacao, Av. Francisco de Miranda',
    tipo_cliente: 'Cafetería Heladería', zona: 'Chacao', estado: 'Potencial', tipo_pago: 'Contado',
    vendedor_asignado: 'Vendedor E', ruta: 'Ruta 3 (Zona Este)', latitud: 10.49, longitud: -66.88,
    contacto_nombre: 'Carlos Chacao', limite_credito: 0, observaciones: '', fecha_registro: '2026-01-01T00:00:00.000Z',
    sincronizado: true, fotos_soportes: [],
  },
  {
    id: 'J-77665544-3', razon_social: 'RESTAURANTE EL ROSAL', nombre_fantasia: 'Restaurante El Rosal',
    rif: 'J-77665544-3', telefono: '0212-1112222', direccion: 'El Rosal, entre calles 3 y 4',
    tipo_cliente: 'Restaurantes Horecas', zona: 'El Rosal', estado: 'En negociación', tipo_pago: 'Crédito',
    vendedor_asignado: 'Vendedor F', ruta: 'Ruta 3 (Zona Este)', latitud: 10.485, longitud: -66.875,
    contacto_nombre: 'Chef Rosal', limite_credito: 500, observaciones: '', fecha_registro: '2026-01-01T00:00:00.000Z',
    sincronizado: true, fotos_soportes: [],
  },
];
