import { db } from '../db/database';
import type { Cliente, Pedido } from '../types';
import { WEBAPP_URL_DEFAULT, TOKEN_DEFAULT } from '../config';

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
  // Usa lo que el admin haya guardado en ESTE equipo; si no hay nada,
  // cae al valor "de fábrica" (src/config.ts), que viene en todos los equipos.
  const url = await db.configuracion.get('webapp_url');
  const tok = await db.configuracion.get('token');
  const guardadaUrl = (url?.valor as string) ?? '';
  const guardadoTok = (tok?.valor as string) ?? '';
  return {
    webappUrl: guardadaUrl || WEBAPP_URL_DEFAULT,
    token: guardadoTok || TOKEN_DEFAULT,
  };
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

// Sube precios/stock editados por el admin en la app (pendientes).
export async function syncCatalogoPush(): Promise<number> {
  const pendientes = await db.productos.filter((p) => p.sincronizado === false).toArray();
  if (pendientes.length === 0) return 0;
  try {
    await llamar('pushCatalogo', pendientes.map((p) => ({
      codigo: p.codigo, descripcion: p.descripcion, grupo: p.grupo, sub_grupo: p.sub_grupo,
      precio_unitario: p.precio_unitario, unidad: p.unidad, stock: p.stock ?? '',
    })));
  } catch (e) {
    // Script viejo sin pushCatalogo: no romper el resto de la sincronización.
    console.warn('pushCatalogo no disponible (¿falta redeployar el Apps Script?):', (e as Error).message);
    return 0;
  }
  await db.productos.bulkPut(pendientes.map((p) => ({ ...p, sincronizado: true })));
  return pendientes.length;
}

// Baja el catálogo desde la hoja y actualiza precios/stock locales.
// "La app gana": no pisa productos con ediciones locales pendientes de subir.
export async function syncCatalogo(): Promise<number> {
  const data = await llamar('getCatalogo');
  const rows = (data.rows as any[]) ?? [];
  if (rows.length === 0) return 0;
  let actualizados = 0;
  for (const r of rows) {
    const codigo = Number(r.codigo);
    if (!codigo) continue;
    const local = await db.productos.get(codigo);
    if (local && local.sincronizado === false) continue; // edición local pendiente: no pisar
    await db.productos.put({
      codigo,
      descripcion: String(r.descripcion),
      grupo: String(r.grupo ?? ''),
      sub_grupo: String(r.sub_grupo ?? ''),
      precio_unitario: Number(r.precio_unitario) || 0,
      unidad: String(r.unidad ?? ''),
      stock: r.stock !== '' && r.stock != null ? Number(r.stock) : undefined,
      sincronizado: true,
    });
    actualizados++;
  }
  return actualizados;
}

// Baja clientes desde la hoja: agrega los NUEVOS (registrados en otros equipos)
// y propaga los ELIMINADOS por el admin a este dispositivo.
// Regla "la app gana": nunca pisa un cliente con cambios locales pendientes.
export async function syncDesdeSheets(): Promise<number> {
  const data = await llamar('getClientes');
  const rows = (data.rows as any[]) ?? [];
  let cambios = 0;
  for (const r of rows) {
    const id = String(r.id ?? r.rif ?? '').trim();
    if (!id) continue;
    const borradoEnSheets = String(r.estado).toUpperCase() === 'ELIMINADO';
    const existe = await db.clientes.get(id);

    if (!existe) {
      // Nuevo (de otro equipo). Los borrados no se re-importan.
      if (!borradoEnSheets) {
        await db.clientes.put(filaACliente(r, id));
        cambios++;
      }
      continue;
    }

    // Ya existe aquí. Si tiene cambios locales sin subir, la app gana: no tocar.
    if (!existe.sincronizado) continue;

    // Propagar el borrado del admin a este dispositivo.
    if (borradoEnSheets && !existe.eliminado) {
      await db.clientes.update(id, { eliminado: true, sincronizado: true });
      cambios++;
    }
  }
  return cambios;
}

// Baja pedidos desde la hoja (los de otros equipos), para que el admin pueda
// supervisar y Carga/Despacho funcionen en el celular del almacenista y el
// despachador. Solo pedidos recientes (entrega en los últimos 30 días o futura),
// para no llenar los teléfonos de historial. "La app gana": nunca pisa un
// pedido que ya exista en este dispositivo; solo agrega los que faltan y
// propaga los eliminados.
const DIAS_HISTORIAL_PEDIDOS = 30;

export async function syncPedidosDesdeSheets(): Promise<number> {
  let data: any;
  try {
    data = await llamar('getPedidos');
  } catch (e) {
    // Si el Apps Script desplegado aún no tiene la acción getPedidos (versión
    // vieja), no rompemos el resto de la sincronización: solo avisamos en consola.
    console.warn('getPedidos no disponible en el Web App (¿falta redeployar el Apps Script?):', (e as Error).message);
    return 0;
  }
  const rows = (data.rows as any[]) ?? [];
  const corte = new Date();
  corte.setDate(corte.getDate() - DIAS_HISTORIAL_PEDIDOS);

  let cambios = 0;
  for (const r of rows) {
    const id = String(r.id ?? '').trim();
    if (!id) continue;
    const borradoEnSheets = String(r.estado_pedido).toLowerCase() === 'eliminado';
    const existe = await db.pedidos.get(id);

    if (!existe) {
      if (borradoEnSheets) continue; // borrados no se re-importan
      const p = filaAPedido(r, id);
      if (!p) continue; // fila corrupta: se ignora sin romper la sync
      if (new Date(p.fecha_entrega) < corte) continue; // muy viejo: no bajar
      await db.pedidos.put(p);
      cambios++;
      continue;
    }

    if (!existe.sincronizado) continue; // cambios locales pendientes: la app gana

    if (borradoEnSheets && !existe.eliminado) {
      await db.pedidos.update(id, { eliminado: true, sincronizado: true });
      cambios++;
    }
  }
  return cambios;
}

export interface ResultadoSync {
  subeClientes: number;   // clientes subidos
  subePedidos: number;    // pedidos subidos
  subeCatalogo: number;   // precios/stock editados por el admin, subidos
  bajaCatalogo: number;   // productos/precios actualizados desde Sheets
  bajaClientes: number;   // clientes nuevos/eliminados traídos desde Sheets
  bajaPedidos: number;    // pedidos nuevos/eliminados traídos desde Sheets
}

// Candado: evita sincronizaciones simultáneas (login + volver internet +
// intervalo de 5 min + botón manual pueden coincidir). Si ya hay una en
// curso, se reutiliza esa misma promesa.
let syncEnCurso: Promise<ResultadoSync> | null = null;

// Sincronización BIDIRECCIONAL (la que dispara el botón y el auto-sync):
//  1) SUBE clientes y pedidos pendientes (la app siempre gana: sobrescribe Sheets).
//  2) BAJA catálogo/precios, clientes y pedidos nuevos de otros equipos, y
//     propaga los eliminados. Nunca pisa cambios locales pendientes.
export async function sincronizarTodo(): Promise<ResultadoSync> {
  if (syncEnCurso) return syncEnCurso;
  syncEnCurso = (async () => {
    try {
      const subeClientes = await syncClientes();
      const subePedidos = await syncPedidos();
      const subeCatalogo = await syncCatalogoPush();
      const bajaCatalogo = await syncCatalogo();
      const bajaClientes = await syncDesdeSheets();
      const bajaPedidos = await syncPedidosDesdeSheets();
      return { subeClientes, subePedidos, subeCatalogo, bajaCatalogo, bajaClientes, bajaPedidos };
    } finally {
      syncEnCurso = null;
    }
  })();
  return syncEnCurso;
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

// Fila de la hoja → Pedido local. Devuelve null si la fila está corrupta
// (por ejemplo, lineas_json mal editado a mano en Sheets).
function filaAPedido(r: any, id: string): Pedido | null {
  let lineas: Pedido['lineas'];
  try {
    lineas = JSON.parse(String(r.lineas_json ?? '[]'));
    if (!Array.isArray(lineas)) return null;
  } catch {
    return null;
  }
  const fechaEntrega = String(r.fecha_entrega ?? '');
  if (!fechaEntrega || isNaN(new Date(fechaEntrega).getTime())) return null;
  return {
    id,
    fecha_pedido: String(r.fecha_pedido ?? new Date().toISOString()),
    fecha_entrega: fechaEntrega,
    vendedor: String(r.vendedor ?? ''),
    ruta: String(r.ruta ?? ''),
    cliente_id: String(r.cliente_id ?? ''),
    cliente_nombre: String(r.cliente_nombre ?? ''),
    tipo_pago: (r.tipo_pago || 'Contado') as Pedido['tipo_pago'],
    estado_pedido: (r.estado_pedido || 'Pendiente') as Pedido['estado_pedido'],
    lineas,
    total_pedido: Number(r.total_pedido) || 0,
    notas: String(r.notas ?? ''),
    sincronizado: true, // viene de Sheets: ya está allá
    entregado: String(r.entregado ?? '').toUpperCase().startsWith('S'),
    obs_entrega: String(r.obs_entrega ?? ''),
  };
}
