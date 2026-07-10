import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { CargaItem, Pedido, Producto, Cliente } from '../types';
import { formatoMoneda, fechaLegible } from './formatters';

const EMPRESA = 'DISTRIBUIDORA';

// ====================================================================
// PDF de Carga del Camión: resumen de cuánto cargar por producto.
// ====================================================================
export function generarPdfCarga(items: CargaItem[], fecha: string, ruta: string): void {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text(`${EMPRESA} — Carga del Camión`, 14, 18);
  doc.setFontSize(11);
  doc.setTextColor(90);
  doc.text(`Fecha de entrega: ${fechaLegible(fecha)}`, 14, 26);
  doc.text(`Zona: ${ruta}`, 14, 32);

  autoTable(doc, {
    startY: 38,
    head: [['Código', 'Producto', 'Grupo', 'Cant. a cargar', 'Unidad']],
    body: items.map((i) => [
      i.producto_codigo, i.producto_descripcion, i.grupo, i.cantidad_total, i.unidad,
    ]),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [66, 133, 244] },
  });

  doc.save(`carga-${fecha}-${ruta.replace(/[^\w]/g, '_')}.pdf`);
}

// ====================================================================
// PDF de Despacho consolidado: una guía por cliente, todas en un PDF.
// ====================================================================
export function generarPdfDespacho(pedidos: Pedido[], fecha: string, ruta: string): void {
  const doc = new jsPDF();

  pedidos.forEach((p, idx) => {
    if (idx > 0) doc.addPage();

    doc.setFontSize(16);
    doc.setTextColor(0);
    doc.text(`${EMPRESA} — Guía de Entrega`, 14, 18);
    doc.setFontSize(10);
    doc.setTextColor(90);
    doc.text(`Fecha: ${fechaLegible(fecha)}    Zona: ${ruta}`, 14, 25);

    // Datos del cliente
    doc.setTextColor(0);
    doc.setFontSize(12);
    doc.text(p.cliente_nombre, 14, 35);
    doc.setFontSize(9);
    doc.setTextColor(90);
    doc.text(`Pago: ${p.tipo_pago}`, 14, 41);
    if (p.notas) doc.text(`Notas: ${p.notas}`, 14, 46);

    autoTable(doc, {
      startY: 52,
      head: [['Cant.', 'Producto', 'P. Unit.', 'Subtotal']],
      body: p.lineas.map((l) => [
        l.cantidad, l.producto_descripcion, formatoMoneda(l.precio_unitario), formatoMoneda(l.subtotal),
      ]),
      foot: [['', '', 'TOTAL', formatoMoneda(p.total_pedido)]],
      styles: { fontSize: 9 },
      headStyles: { fillColor: [66, 133, 244] },
      footStyles: { fillColor: [240, 240, 240], textColor: 0, fontStyle: 'bold' },
    });

    // Líneas de firma
    // @ts-expect-error lastAutoTable lo agrega el plugin autotable
    const y = (doc.lastAutoTable?.finalY ?? 120) + 25;
    doc.setTextColor(0);
    doc.setFontSize(9);
    doc.line(20, y, 90, y);
    doc.text('Recibido conforme', 30, y + 5);
    doc.text('(nombre, cédula, firma, sello)', 22, y + 10);
    doc.line(120, y, 180, y);
    doc.text('Entregado por', 138, y + 5);
  });

  doc.save(`despacho-${fecha}-${ruta.replace(/[^\w]/g, '_')}.pdf`);
}

// ====================================================================
// PDF de Catálogo/Inventario: SKU, producto, stock disponible y precio,
// agrupado por categoría (grupo) para que se vea prolijo como catálogo.
// ====================================================================
export function generarPdfCatalogo(productos: Producto[]): void {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.setTextColor(0);
  doc.text(`${EMPRESA} — Catálogo e Inventario`, 14, 18);
  doc.setFontSize(10);
  doc.setTextColor(90);
  doc.text(`Generado: ${fechaLegible(new Date().toISOString())}`, 14, 25);

  const porGrupo = new Map<string, Producto[]>();
  for (const p of productos) {
    const clave = p.grupo || 'Sin categoría';
    const lista = porGrupo.get(clave) ?? [];
    lista.push(p);
    porGrupo.set(clave, lista);
  }
  const gruposOrdenados = [...porGrupo.keys()].sort((a, b) => a.localeCompare(b));

  let startY = 32;
  for (const grupo of gruposOrdenados) {
    const items = porGrupo.get(grupo)!.sort((a, b) => a.descripcion.localeCompare(b.descripcion));
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text(grupo, 14, startY);

    autoTable(doc, {
      startY: startY + 4,
      head: [['SKU', 'Producto', 'Disponible', 'Precio']],
      body: items.map((p) => [
        p.codigo, p.descripcion, p.stock ?? '—', formatoMoneda(p.precio_unitario),
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [66, 133, 244] },
      margin: { top: 20 },
    });

    // @ts-expect-error lastAutoTable lo agrega el plugin autotable
    startY = (doc.lastAutoTable?.finalY ?? startY + 20) + 10;
    if (startY > 260) { doc.addPage(); startY = 20; }
  }

  const fecha = new Date().toISOString().slice(0, 10);
  doc.save(`catalogo-${fecha}.pdf`);
}

// ====================================================================
// PDF con el listado de clientes de UN vendedor (los que tiene asignados).
// ====================================================================
export function generarPdfClientesVendedor(clientes: Cliente[], nombreVendedor: string): void {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.setTextColor(0);
  doc.text(`${EMPRESA} — Mis Clientes`, 14, 18);
  doc.setFontSize(10);
  doc.setTextColor(90);
  doc.text(`Vendedor: ${nombreVendedor}`, 14, 25);
  doc.text(`Generado: ${fechaLegible(new Date().toISOString())}`, 14, 30);

  autoTable(doc, {
    startY: 36,
    head: [['Cliente', 'RIF/Cédula', 'Teléfono', 'Dirección', 'Ruta', 'Día visita']],
    body: clientes.map((c) => [
      c.nombre_fantasia || c.razon_social, c.rif, c.telefono, c.direccion, c.ruta, c.dia_visita ?? '—',
    ]),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [66, 133, 244] },
  });

  const fecha = new Date().toISOString().slice(0, 10);
  doc.save(`mis-clientes-${fecha}.pdf`);
}
