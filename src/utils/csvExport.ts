import type { Producto } from '../types';

// Escapa un valor para CSV: si contiene coma, comillas o salto de línea, lo envuelve en
// comillas dobles y duplica las comillas internas (regla estándar RFC 4180).
function escaparCSV(valor: string | number | undefined): string {
  const texto = String(valor ?? '');
  if (/[",\n]/.test(texto)) {
    return `"${texto.replace(/"/g, '""')}"`;
  }
  return texto;
}

// Genera y descarga un CSV del catálogo de productos (código, descripción, grupo,
// sub-grupo, precio, unidad, stock). Sin librerías: Blob + <a download>.
// Antepone BOM UTF-8 para que Excel muestre bien los acentos al abrir directo.
export function descargarInventarioCSV(productos: Producto[]): void {
  const encabezado = ['Codigo', 'Descripcion', 'Grupo', 'Sub-grupo', 'Precio', 'Unidad', 'Stock'];
  const filas = productos.map((p) => [
    p.codigo,
    p.descripcion,
    p.grupo,
    p.sub_grupo,
    p.precio_unitario,
    p.unidad,
    p.stock ?? '',
  ].map(escaparCSV).join(','));

  const csv = [encabezado.join(','), ...filas].join('\r\n');
  const BOM = '﻿'; // para que Excel muestre bien los acentos
  const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const fecha = new Date().toISOString().slice(0, 10);
  a.download = `inventario-${fecha}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
