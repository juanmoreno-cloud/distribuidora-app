import type { Pedido } from '../types';
import { formatoMoneda, fechaLegible } from './formatters';

// Genera el texto plano de un pedido para compartir por WhatsApp.
export function textoPedidoWhatsApp(p: Pedido): string {
  const lineas = p.lineas
    .map((l) => `• ${l.cantidad} x ${l.producto_descripcion} = ${formatoMoneda(l.subtotal)}`)
    .join('\n');
  return [
    `*PEDIDO - ${p.cliente_nombre}*`,
    `Vendedor: ${p.vendedor}`,
    `Entrega: ${fechaLegible(p.fecha_entrega)}`,
    `Pago: ${p.tipo_pago}`,
    '',
    lineas,
    '',
    `*TOTAL: ${formatoMoneda(p.total_pedido)}*`,
    p.notas ? `\nNotas: ${p.notas}` : '',
  ].join('\n').trim();
}

// Abre WhatsApp con el texto pre-cargado (funciona en celular y web).
export function compartirWhatsApp(texto: string): void {
  const url = `https://wa.me/?text=${encodeURIComponent(texto)}`;
  window.open(url, '_blank');
}
