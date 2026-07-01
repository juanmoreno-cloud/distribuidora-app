import { db } from '../db/database';
import type { Cliente, Pedido, Usuario } from '../types';

// ====================================================================
// Lógica de borrado (SOLO admin). Regla:
//  - Si el registro ya se sincronizó con Sheets: borrado SUAVE
//    (eliminado = true, sincronizado = false) para conservar el
//    historial y marcarlo como ELIMINADO en Sheets al sincronizar.
//  - Si es solo local (nunca sincronizado): borrado FÍSICO de IndexedDB.
// La verificación de rol se hace aquí, no solo en la UI.
// ====================================================================

function exigirAdmin(usuario: Usuario | null): asserts usuario is Usuario {
  if (!usuario || usuario.rol !== 'admin') {
    throw new Error('Solo un administrador puede eliminar.');
  }
}

function log(usuario: Usuario, accion: string, id: string) {
  console.log(`[${new Date().toISOString()}] Admin ${usuario.username} ${accion} ${id}`);
}

// Pedidos activos (no eliminados) de un cliente.
export async function contarPedidosDeCliente(clienteId: string): Promise<number> {
  const pedidos = await db.pedidos.where('cliente_id').equals(clienteId).toArray();
  return pedidos.filter((p) => !p.eliminado).length;
}

export async function eliminarCliente(cliente: Cliente, usuario: Usuario | null): Promise<void> {
  exigirAdmin(usuario);
  if (cliente.sincronizado) {
    await db.clientes.update(cliente.id, { eliminado: true, sincronizado: false });
  } else {
    await db.clientes.delete(cliente.id);
  }
  log(usuario, 'eliminó cliente', cliente.id);
}

export async function eliminarPedido(pedido: Pedido, usuario: Usuario | null): Promise<void> {
  exigirAdmin(usuario);
  if (pedido.sincronizado) {
    await db.pedidos.update(pedido.id, { eliminado: true, sincronizado: false });
  } else {
    await db.pedidos.delete(pedido.id);
  }
  log(usuario, 'eliminó pedido', pedido.id);
}

// Elimina un cliente y todos sus pedidos asociados.
export async function eliminarClienteConPedidos(cliente: Cliente, usuario: Usuario | null): Promise<void> {
  exigirAdmin(usuario);
  const pedidos = await db.pedidos.where('cliente_id').equals(cliente.id).toArray();
  for (const p of pedidos.filter((x) => !x.eliminado)) {
    await eliminarPedido(p, usuario);
  }
  await eliminarCliente(cliente, usuario);
}

// ---- Papelera ----
export async function restaurarCliente(cliente: Cliente, usuario: Usuario | null): Promise<void> {
  exigirAdmin(usuario);
  await db.clientes.update(cliente.id, { eliminado: false, sincronizado: false });
  log(usuario, 'restauró cliente', cliente.id);
}

export async function restaurarPedido(pedido: Pedido, usuario: Usuario | null): Promise<void> {
  exigirAdmin(usuario);
  await db.pedidos.update(pedido.id, { eliminado: false, sincronizado: false });
  log(usuario, 'restauró pedido', pedido.id);
}

// Borrado físico definitivo (desde la papelera). La fila en Sheets queda
// marcada como ELIMINADO (historial); no se borra físicamente de Sheets.
export async function eliminarClienteDefinitivo(cliente: Cliente, usuario: Usuario | null): Promise<void> {
  exigirAdmin(usuario);
  await db.clientes.delete(cliente.id);
  log(usuario, 'eliminó definitivamente cliente', cliente.id);
}

export async function eliminarPedidoDefinitivo(pedido: Pedido, usuario: Usuario | null): Promise<void> {
  exigirAdmin(usuario);
  await db.pedidos.delete(pedido.id);
  log(usuario, 'eliminó definitivamente pedido', pedido.id);
}
