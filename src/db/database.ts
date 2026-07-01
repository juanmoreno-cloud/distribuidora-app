import Dexie, { type Table } from 'dexie';
import type { Cliente, Producto, Pedido, ConfigItem, Usuario } from '../types';
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
  }
}
