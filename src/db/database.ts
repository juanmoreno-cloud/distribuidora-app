import Dexie, { type Table } from 'dexie';
import type { Cliente, Producto, Pedido, ConfigItem, Usuario, Ruta } from '../types';
import { CATALOGO_SEED } from './seedCatalogo';
import { CLIENTES_SEED } from './seedClientes';
import { USUARIOS_SEED } from './seedUsuarios';

// ====================================================================
// Base de datos local (IndexedDB) con Dexie.
// Todo se guarda aqui primero (offline-first). La sincronizacion con
// Google Sheets (Fase 7) lee/escribe sobre estas mismas tablas.
// ====================================================================
export class DistribuidoraDB extends Dexie {
  clientes!: Table<Cliente, string>;
  productos!: Table<Producto, number>;
  pedidos!: Table<Pedido, string>;
  configuracion!: Table<ConfigItem, string>;
  usuarios!: Table<Usuario, string>;

  constructor() {
    super('distribuidora-db');
    // Los indices ayudan a buscar/filtrar rapido. El primer campo es la clave primaria.
    this.version(1).stores({
      clientes: 'id, nombre_fantasia, razon_social, rif, ruta, vendedor_asignado, sincronizado',
      productos: 'codigo, descripcion, grupo',
      pedidos: 'id, fecha_entrega, ruta, vendedor, cliente_id, sincronizado',
      configuracion: 'clave',
    });
    // v2: agrega la tabla de usuarios (login con roles). Dexie migra sin perder datos.
    this.version(2).stores({
      usuarios: 'id, username, rol, activo',
    });
  }
}

export const db = new DistribuidoraDB();

// Migración v11: las rutas viejas (Ruta 1/2/3) se reemplazaron por rutas reales
// (Catia/El Paraíso/Quinta Crespo, cada una con 1 y 2). Clientes y pedidos ya
// guardados con el valor viejo (locales o bajados de Sheets antes de esta
// versión) se reasignan a la ruta "1" del reemplazo correspondiente, y se
// marcan sin sincronizar para que el dato corregido suba a Sheets en el
// próximo sync (si no, "la app gana" nunca corrige la fila vieja del Sheet).
const MIGRACION_RUTAS: Record<string, string> = {
  'Ruta 1 (Zona Oeste/Norte)': 'Catia 1',
  'Ruta 2 (Zona Centro/Sur)': 'El Paraíso 1',
  'Ruta 3 (Zona Este)': 'Quinta Crespo 1',
};

async function migrarRutasViejas(): Promise<void> {
  const ahora = new Date().toISOString();
  for (const [vieja, nueva] of Object.entries(MIGRACION_RUTAS)) {
    const rutaNueva = nueva as Ruta;
    await db.clientes.where('ruta').equals(vieja).modify({ ruta: rutaNueva, sincronizado: false, actualizado_en: ahora });
    await db.pedidos.where('ruta').equals(vieja).modify({ ruta: rutaNueva, sincronizado: false, actualizado_en: ahora });
  }
  // Los vendedores ya sembrados en este teléfono (antes de v11) conservan su
  // ruta_asignada vieja porque el seed solo agrega usuarios que faltan, nunca
  // pisa los que ya existen. Sin esto, el campo Ruta (ahora de solo lectura
  // para el vendedor) quedaría trabado mostrando un valor que ya no existe.
  await db.usuarios
    .filter((u) => !!u.ruta_asignada && u.ruta_asignada in MIGRACION_RUTAS)
    .modify((u) => { u.ruta_asignada = MIGRACION_RUTAS[u.ruta_asignada as string]; });
}

// Carga las semillas solo si las tablas estan vacias (primer arranque).
export async function seedSiVacia(): Promise<void> {
  const totalProductos = await db.productos.count();
  if (totalProductos === 0) {
    await db.productos.bulkAdd(CATALOGO_SEED);
  }
  const totalClientes = await db.clientes.count();
  if (totalClientes === 0) {
    await db.clientes.bulkAdd(CLIENTES_SEED);
  }
  const totalUsuarios = await db.usuarios.count();
  if (totalUsuarios === 0) {
    await db.usuarios.bulkAdd(USUARIOS_SEED);
  } else {
    // Normalización: los usuarios de fábrica ya no exigen cambio de clave.
    // (Equipos sembrados con la versión anterior quedaban pidiéndolo siempre.)
    // Los usuarios creados por el admin conservan su configuración.
    await db.usuarios
      .filter((u) => u.creado_por === 'sistema' && u.debe_cambiar_clave)
      .modify({ debe_cambiar_clave: false });
    // Agregar los usuarios de fábrica que falten (ej: nuevos roles en una
    // versión posterior) sin tocar los que ya existen.
    for (const seed of USUARIOS_SEED) {
      if (!(await db.usuarios.get(seed.id))) {
        await db.usuarios.add(seed);
      }
    }
  }
  await migrarRutasViejas();
}
