// Genera un identificador único. Usa crypto.randomUUID cuando está disponible,
// pero cae a un método propio cuando NO lo está: eso pasa en "contexto no seguro"
// (cuando la app se abre por IP de red con http://, no por https ni localhost),
// que es justo el caso de los vendedores abriendo la app en el celular por WiFi.
export function uuid(): string {
  const c = globalThis.crypto as Crypto | undefined;
  if (c && typeof c.randomUUID === 'function') {
    try { return c.randomUUID(); } catch { /* sigue al respaldo */ }
  }
  // Respaldo RFC4122 v4 (suficiente para IDs locales de la app).
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (ch) => {
    const r = (Math.random() * 16) | 0;
    const v = ch === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
