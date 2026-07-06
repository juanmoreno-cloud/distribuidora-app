import type { Cliente } from '../types';

// ====================================================================
// 8 clientes de ejemplo para que la app no este vacia al iniciar.
// Se cargan solo en el primer arranque (si la tabla esta vacia).
// ====================================================================
export const CLIENTES_SEED: Cliente[] = [
  {
    id: 'J-12345678-9', razon_social: 'PANADERIA LAS DUEÑAS', nombre_fantasia: 'Panaderia Las Dueñas',
    tipo_documento: 'RIF', rif: 'J-12345678-9', telefono: '0412-1234567', direccion: '23 de Enero, cerca del Hospital del Oeste',
    tipo_cliente: 'Panadería Pastelería', zona: '23 de Enero', estado: 'Potencial', tipo_pago: 'Contado',
    vendedor_asignado: 'Vendedor A', ruta: 'Catia 1', latitud: 10.520827, longitud: -66.941768,
    contacto_nombre: 'María Dueñas', contacto_telefono: '', limite_credito: 0, observaciones: '', fecha_registro: '2026-01-01T00:00:00.000Z',
    sincronizado: true, fotos_soportes: [],
  },
  {
    id: 'J-87654321-0', razon_social: 'AVEIRO PAN', nombre_fantasia: 'Aveiro Pan',
    tipo_documento: 'RIF', rif: 'J-87654321-0', telefono: '0414-9876543', direccion: '23 de Enero, Av. Principal',
    tipo_cliente: 'Panadería Pastelería', zona: '23 de Enero', estado: 'Potencial', tipo_pago: 'Contado',
    vendedor_asignado: 'Vendedor A', ruta: 'Catia 1', latitud: 10.522765, longitud: -66.941823,
    contacto_nombre: 'Luis Aveiro', contacto_telefono: '', limite_credito: 0, observaciones: '', fecha_registro: '2026-01-01T00:00:00.000Z',
    sincronizado: true, fotos_soportes: [],
  },
  {
    id: 'J-11223344-5', razon_social: 'ACARAMELADOS ALTA VISTA', nombre_fantasia: 'Acaramelados Alta Vista',
    tipo_documento: 'RIF', rif: 'J-11223344-5', telefono: '0424-5556677', direccion: 'Alta Vista, edificio rojo',
    tipo_cliente: 'Panadería Pastelería', zona: 'Catia', estado: 'En negociación', tipo_pago: 'Crédito',
    vendedor_asignado: 'Vendedor B', ruta: 'Catia 2', latitud: 10.521924, longitud: -66.942116,
    contacto_nombre: 'Pedro Caramel', contacto_telefono: '', limite_credito: 500, observaciones: '', fecha_registro: '2026-01-01T00:00:00.000Z',
    sincronizado: true, fotos_soportes: [],
  },
  {
    id: 'V-12345678', razon_social: 'LOS RIZO', nombre_fantasia: 'Los Rizo',
    tipo_documento: 'RIF', rif: 'V-12345678', telefono: '0412-3334444', direccion: '23 de Enero, esquina de la panadería',
    tipo_cliente: 'Street Food', zona: '23 de Enero', estado: 'Potencial', tipo_pago: 'Contado',
    vendedor_asignado: 'Vendedor B', ruta: 'Catia 2', latitud: 10.521415, longitud: -66.940521,
    contacto_nombre: 'Rizo Rizo', contacto_telefono: '', limite_credito: 0, observaciones: '', fecha_registro: '2026-01-01T00:00:00.000Z',
    sincronizado: true, fotos_soportes: [],
  },
  {
    id: 'J-55667788-9', razon_social: 'CARNICERIA EL CEMENTERIO', nombre_fantasia: 'Carnicería El Cementerio',
    tipo_documento: 'RIF', rif: 'J-55667788-9', telefono: '0212-4445555', direccion: 'El Cementerio, calle 5',
    tipo_cliente: 'Carnicería y frigorífico', zona: 'El Paraíso', estado: 'Activo', tipo_pago: 'Crédito',
    vendedor_asignado: 'Vendedor C', ruta: 'El Paraíso 1', latitud: 10.51, longitud: -66.92,
    contacto_nombre: 'José Carnes', contacto_telefono: '', limite_credito: 500, observaciones: '', fecha_registro: '2026-01-01T00:00:00.000Z',
    sincronizado: true, fotos_soportes: [],
  },
  {
    id: 'J-99887766-5', razon_social: 'BODEGA LA VEGA', nombre_fantasia: 'Bodega La Vega',
    tipo_documento: 'RIF', rif: 'J-99887766-5', telefono: '0416-7778888', direccion: 'La Vega, local 12',
    tipo_cliente: 'Bodegas', zona: 'Quinta Crespo', estado: 'Potencial', tipo_pago: 'Contado',
    vendedor_asignado: 'Vendedor D', ruta: 'El Paraíso 2', latitud: 10.505, longitud: -66.915,
    contacto_nombre: 'Ana Vega', contacto_telefono: '', limite_credito: 0, observaciones: '', fecha_registro: '2026-01-01T00:00:00.000Z',
    sincronizado: true, fotos_soportes: [],
  },
  {
    id: 'J-33445566-7', razon_social: 'CAFETERIA CHACAO', nombre_fantasia: 'Cafetería Chacao',
    tipo_documento: 'RIF', rif: 'J-33445566-7', telefono: '0412-9990000', direccion: 'Chacao, Av. Francisco de Miranda',
    tipo_cliente: 'Cafetería Heladería', zona: 'San Bernardino', estado: 'Potencial', tipo_pago: 'Contado',
    vendedor_asignado: 'Vendedor E', ruta: 'Quinta Crespo 1', latitud: 10.49, longitud: -66.88,
    contacto_nombre: 'Carlos Chacao', contacto_telefono: '', limite_credito: 0, observaciones: '', fecha_registro: '2026-01-01T00:00:00.000Z',
    sincronizado: true, fotos_soportes: [],
  },
  {
    id: 'J-77665544-3', razon_social: 'RESTAURANTE EL ROSAL', nombre_fantasia: 'Restaurante El Rosal',
    tipo_documento: 'RIF', rif: 'J-77665544-3', telefono: '0212-1112222', direccion: 'El Rosal, entre calles 3 y 4',
    tipo_cliente: 'Restaurantes Horecas', zona: 'Quinta Crespo', estado: 'En negociación', tipo_pago: 'Crédito',
    vendedor_asignado: 'Vendedor F', ruta: 'Quinta Crespo 2', latitud: 10.485, longitud: -66.875,
    contacto_nombre: 'Chef Rosal', contacto_telefono: '', limite_credito: 500, observaciones: '', fecha_registro: '2026-01-01T00:00:00.000Z',
    sincronizado: true, fotos_soportes: [],
  },
];
