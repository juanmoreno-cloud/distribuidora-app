import Dexie, { type Table } from 'dexie';
import type { Cliente, Producto, Pedido, ConfigItem } from '../types';
import { CATALOGO_SEED } from './seedCatalogo';
import { CLIENTES_SEED } from './seedClientes';

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

  constructor() {
    super('distribuidora-db');
    // Los indices ayudan a buscar/filtrar rapido. El primer campo es la clave primaria.
    this.version(1).stores({
      clientes: 'id, nombre_fantasia, razon_social, rif, ruta, vendedor_asignado, sincronizado',
      productos: 'codigo, descripcion, grupo',
      pedidos: 'id, fecha_entrega, ruta, vendedor, cliente_id, sincronizado',
      configuracion: 'clave',
    });
  }
}

export const db = new DistribuidoraDB();

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
}
