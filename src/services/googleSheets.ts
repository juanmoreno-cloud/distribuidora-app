import { db } from '../db/database';
import type { Cliente, Pedido, Producto } from '../types';

// ====================================================================
// Sincronización con Google Sheets a través de un Apps Script Web App.
// No usa llaves secretas en el teléfono: solo la URL pública del Web App.
// Si no hay internet o falla, NO rompe nada: deja los datos como
// pendientes (sincronizado = false) para reintentar luego.
// ====================================================================

export interface ConfigSync {
  webappUrl: string;
  token: string;
}

export async function leerConfigSync(): Promise<ConfigSync> {
  const url = await db.configuracion.get('webapp_url');
  const tok = await db.configuracion.get('token');
  return { webappUrl: (url?.valor as string) ?? '', token: (tok?.valor as string) ?? '' };
}

export async function guardarConfigSync(cfg: ConfigSync): Promise<void> {
  await db.configuracion.put({ clave: 'webapp_url', valor: cfg.webappUrl.trim() });
  await db.configuracion.put({ clave: 'token', valor: cfg.token.trim() });
}

// Llama al Web App. Usa text/plain para evitar el "preflight" de CORS.
async function llamar(action: string, payload?: unknown): Promise<any> {
  const { webappUrl, token } = await leerConfigSync();
  if (!webappUrl) throw new Error('Falta configurar la URL del Web App (pantalla Configuración).');

  const resp = await fetch(webappUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action, token, payload }),
  });
  if (!resp.ok) throw new Error('El servidor respondió ' + resp.status);
  const data = await resp.json();
  if (!data.ok) throw new Error(data.error || 'Error desconocido del Web App');
  return data;
}

// Prueba la conexión (botón "Probar" en Configuración).
export async function probarConexion(): Promise<boolean> {
  const data = await llamar('ping');
  return !!data.pong;
}

// Sube los clientes pendientes y los marca como sincronizados.
export async function syncClientes(): Promise<number> {
  const pendientes = await db.clientes.filter((c) => !c.sincronizado).toArray();
  if (pendientes.length === 0) return 0;
  await llamar('pushClientes', pendientes.map(clienteAFila));
  await db.clientes.bulkPut(pendientes.map((c) => ({ ...c, sincronizado: true })));
  return pendientes.length;
}

// Sube los pedidos pendientes y los marca como sincronizados.
export async function syncPedidos(): Promise<number> {
  const pendientes = await db.pedidos.filter((p) => !p.sincronizado).toArray();
  if (pendientes.length === 0) return 0;
  await llamar('pushPedidos', pendientes.map(pedidoAFila));
  await db.pedidos.bulkPut(pendientes.map((p) => ({ ...p, sincronizado: true })));
  return pendientes.length;
}

// Baja el catálogo desde la hoja y actualiza los precios locales.
export async function syncCatalogo(): Promise<number> {
  const data = await llamar('getCatalogo');
  const rows = (data.rows as any[]) ?? [];
  if (rows.length === 0) return 0;
  const productos: Producto[] = rows.map((r) => ({
    codigo: Number(r.codigo),
    descripcion: String(r.descripcion),
    grupo: String(r.grupo ?? ''),
    sub_grupo: String(r.sub_grupo ?? ''),
    precio_unitario: Number(r.precio_unitario) || 0,
    unidad: String(r.unidad ?? ''),
  })).filter((p) => p.codigo);
  await db.productos.bulkPut(productos);
  return productos.length;
}

// Baja clientes desde la hoja (los que registraron otros vendedores).
export async function syncDesdeSheets(): Promise<number> {
  const data = await llamar('getClientes');
  const rows = (data.rows as any[]) ?? [];
  let nuevos = 0;
  for (const r of rows) {
    const id = String(r.id ?? r.rif ?? '').trim();
    if (!id) continue;
    if (String(r.estado).toUpperCase() === 'ELIMINADO') continue; // no re-importar borrados
    const existe = await db.clientes.get(id);
    if (!existe) {
      await db.clientes.put(filaACliente(r, id));
      nuevos++;
    }
  }
  return nuevos;
}

export interface ResultadoSync {
  subeClientes: number;   // clientes subidos
  subePedidos: number;    // pedidos subidos
  bajaCatalogo: number;   // productos/precios actualizados desde Sheets
  bajaClientes: number;   // clientes nuevos traídos desde Sheets
}

// Sincronización BIDIRECCIONAL (la que dispara el botón y el auto-sync):
//  1) SUBE clientes y pedidos pendientes (la app siempre gana: sobrescribe Sheets).
//  2) BAJA catálogo/precios y clientes NUEVOS (no pisa los que ya existen en la app;
//     no baja pedidos históricos).
export async function sincronizarTodo(): Promise<ResultadoSync> {
  const subeClientes = await syncClientes();
  const subePedidos = await syncPedidos();
  const bajaCatalogo = await syncCatalogo();
  const bajaClientes = await syncDesdeSheets();
  return { subeClientes, subePedidos, bajaCatalogo, bajaClientes };
}

// ---- Conversión a/desde fila de la hoja ----
function clienteAFila(c: Cliente) {
  return {
    id: c.id, razon_social: c.razon_social, nombre_fantasia: c.nombre_fantasia, rif: c.rif,
    telefono: c.telefono, direccion: c.direccion, tipo_cliente: c.tipo_cliente, zona: c.zona,
    // Si el admin lo eliminó, se marca ELIMINADO en Sheets (conserva historial).
    estado: c.eliminado ? 'ELIMINADO' : c.estado, latitud: c.latitud ?? '', longitud: c.longitud ?? '',
    contacto_nombre: c.contacto_nombre, vendedor_asignado: c.vendedor_asignado, ruta: c.ruta,
    tipo_pago: c.tipo_pago, limite_credito: c.limite_credito, observaciones: c.observaciones,
    fecha_registro: c.fecha_registro,
  };
}

function filaACliente(r: any, id: string): Cliente {
  return {
    id, razon_social: String(r.razon_social ?? ''), nombre_fantasia: String(r.nombre_fantasia ?? ''),
    rif: String(r.rif ?? ''), telefono: String(r.telefono ?? ''), direccion: String(r.direccion ?? ''),
    tipo_cliente: (r.tipo_cliente ?? '') as Cliente['tipo_cliente'],
    zona: (r.zona ?? '') as Cliente['zona'],
    estado: (r.estado || 'Potencial') as Cliente['estado'],
    latitud: r.latitud !== '' && r.latitud != null ? Number(r.latitud) : undefined,
    longitud: r.longitud !== '' && r.longitud != null ? Number(r.longitud) : undefined,
    contacto_nombre: String(r.contacto_nombre ?? ''),
    vendedor_asignado: (r.vendedor_asignado ?? '') as Cliente['vendedor_asignado'],
    ruta: (r.ruta ?? '') as Cliente['ruta'],
    tipo_pago: (r.tipo_pago || 'Contado') as Cliente['tipo_pago'],
    limite_credito: Number(r.limite_credito) || 0,
    observaciones: String(r.observaciones ?? ''),
    fecha_registro: String(r.fecha_registro ?? new Date().toISOString()),
    sincronizado: true, fotos_soportes: [],
  };
}

function pedidoAFila(p: Pedido) {
  return {
    id: p.id, fecha_pedido: p.fecha_pedido, fecha_entrega: p.fecha_entrega, vendedor: p.vendedor,
    ruta: p.ruta, cliente_id: p.cliente_id, cliente_nombre: p.cliente_nombre, tipo_pago: p.tipo_pago,
    estado_pedido: p.eliminado ? 'eliminado' : p.estado_pedido, total_pedido: p.total_pedido, notas: p.notas,
    entregado: p.entregado ? 'SÍ' : '', obs_entrega: p.obs_entrega ?? '',
    lineas_json: JSON.stringify(p.lineas),
  };
}
