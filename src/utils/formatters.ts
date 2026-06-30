// Formato de moneda en dolares (los precios del catalogo estan en USD).
export function formatoMoneda(valor: number): string {
  return '$' + (valor || 0).toLocaleString('es-VE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// Fecha ISO -> "yyyy-mm-dd" para inputs de tipo date.
export function aFechaInput(iso: string): string {
  return iso ? iso.slice(0, 10) : '';
}

// Fecha legible en español: "lun 30 jun 2026".
export function fechaLegible(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('es-VE', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
}

// "yyyy-mm-dd" de hoy (zona local), util para defaults de pedidos.
export function hoyISO(): string {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

// "yyyy-mm-dd" de mañana.
export function mananaISO(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}
