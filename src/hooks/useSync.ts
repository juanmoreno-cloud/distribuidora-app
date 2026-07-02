import { useCallback, useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import { leerConfigSync, sincronizarTodo } from '../services/googleSheets';
import { toast } from '../components/Toast';

// Maneja la sincronización: cuenta pendientes, sube datos al volver el
// internet y reintenta cada 5 minutos. Nunca rompe la app si falla.
export function useSync() {
  const [sincronizando, setSincronizando] = useState(false);

  // Cuenta de pendientes en vivo (clientes + pedidos sin sincronizar).
  const pendientes = useLiveQuery(async () => {
    const c = await db.clientes.filter((x) => !x.sincronizado).count();
    const p = await db.pedidos.filter((x) => !x.sincronizado).count();
    return c + p;
  }, []) ?? 0;

  const sincronizar = useCallback(async (silencioso = false) => {
    const { webappUrl } = await leerConfigSync();
    if (!webappUrl) {
      if (!silencioso) toast('Configura primero la URL de Google Sheets.', 'error');
      return;
    }
    if (!navigator.onLine) {
      if (!silencioso) toast('Sin conexión. Se intentará al volver el internet.', 'info');
      return;
    }
    setSincronizando(true);
    try {
      const r = await sincronizarTodo();
      await db.configuracion.put({ clave: 'ultima_sync', valor: new Date().toISOString() });
      if (!silencioso) {
        const subidos = r.subeClientes + r.subePedidos + r.subeCatalogo;
        const bajados = r.bajaCatalogo + r.bajaClientes + r.bajaPedidos;
        const partes: string[] = [];
        if (subidos > 0) partes.push(`${subidos} subido(s)`);
        if (bajados > 0) partes.push(`${bajados} actualizado(s) desde Sheets`);
        toast(partes.length ? `Sincronizado: ${partes.join(' · ')}.` : 'Todo está al día ✓', 'success');
      }
    } catch (e) {
      if (!silencioso) toast('No se pudo sincronizar: ' + (e as Error).message, 'error');
    } finally {
      setSincronizando(false);
    }
  }, []);

  // Auto-sync: al volver el internet y cada 5 minutos.
  useEffect(() => {
    const alVolver = () => sincronizar(true);
    window.addEventListener('online', alVolver);
    const intervalo = setInterval(() => sincronizar(true), 5 * 60 * 1000);
    return () => {
      window.removeEventListener('online', alVolver);
      clearInterval(intervalo);
    };
  }, [sincronizar]);

  return { pendientes, sincronizando, sincronizar };
}
