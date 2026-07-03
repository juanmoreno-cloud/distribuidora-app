import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { db } from '../db/database';
import type { Usuario, SesionAuth } from '../types';
import { hashClave, verificarClave } from './hash';
import { esClaveFuerte } from '../utils/validators';
import { leerConfigSync, sincronizarTodo } from '../services/googleSheets';

// Dispara una sincronización en segundo plano (al iniciar/restaurar sesión).
// Es silenciosa: si no hay internet o falla, no molesta ni rompe nada; el
// auto-sync periódico (useSync) reintentará. Sube pendientes y baja catálogo/clientes.
async function dispararAutoSync(): Promise<void> {
  if (!navigator.onLine) return;
  try {
    const { webappUrl } = await leerConfigSync();
    if (!webappUrl) return;
    await sincronizarTodo();
    await db.configuracion.put({ clave: 'ultima_sync', valor: new Date().toISOString() });
  } catch {
    /* silencioso */
  }
}

const CLAVE_SESION = 'distribuidora_auth';
const EXPIRA_MS = 8 * 60 * 60 * 1000;     // 8 horas de inactividad
const MAX_INTENTOS = 3;
const BLOQUEO_MS = 15 * 60 * 1000;        // 15 minutos

interface Resultado { ok: boolean; error?: string; usuario?: Usuario }

interface AuthCtx {
  usuario: Usuario | null;
  cargando: boolean;
  login: (username: string, clave: string) => Promise<Resultado>;
  logout: () => void;
  cambiarClave: (actual: string, nueva: string) => Promise<Resultado>;
}

const Ctx = createContext<AuthCtx | null>(null);

// ---- Bloqueo por intentos fallidos (por usuario, en este dispositivo) ----
interface Bloqueo { intentos: number; hasta: number }
function leerBloqueo(username: string): Bloqueo {
  try { return JSON.parse(localStorage.getItem('lock_' + username) || '') as Bloqueo; }
  catch { return { intentos: 0, hasta: 0 }; }
}
function guardarBloqueo(username: string, b: Bloqueo) { localStorage.setItem('lock_' + username, JSON.stringify(b)); }
function limpiarBloqueo(username: string) { localStorage.removeItem('lock_' + username); }

// ---- Sesión en localStorage ----
function leerSesionRaw(): SesionAuth | null {
  try { return JSON.parse(localStorage.getItem(CLAVE_SESION) || '') as SesionAuth; }
  catch { return null; }
}
function guardarSesionRaw(s: SesionAuth) {
  localStorage.setItem(CLAVE_SESION, JSON.stringify(s));
  window.dispatchEvent(new Event('auth-cambiada'));
}
function borrarSesionRaw() {
  localStorage.removeItem(CLAVE_SESION);
  window.dispatchEvent(new Event('auth-cambiada'));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(true);

  // Restaura la sesión al abrir la app (si no expiró y el usuario sigue activo).
  useEffect(() => {
    (async () => {
      const s = leerSesionRaw();
      if (s && Date.now() - s.timestamp <= EXPIRA_MS) {
        const u = await db.usuarios.where('username').equals(s.usuario).first();
        if (u && u.activo) {
          guardarSesionRaw({ ...s, timestamp: Date.now() });
          setUsuario(u);
          void dispararAutoSync(); // sincroniza al reabrir la app
        } else {
          borrarSesionRaw();
        }
      } else if (s) {
        borrarSesionRaw();
      }
      setCargando(false);
    })();
  }, []);

  // Refresca el "timestamp" de actividad mientras la app está en uso.
  useEffect(() => {
    if (!usuario) return;
    const tocar = () => {
      const s = leerSesionRaw();
      if (s) localStorage.setItem(CLAVE_SESION, JSON.stringify({ ...s, timestamp: Date.now() }));
    };
    const id = setInterval(tocar, 2 * 60 * 1000);
    window.addEventListener('visibilitychange', tocar);
    return () => { clearInterval(id); window.removeEventListener('visibilitychange', tocar); };
  }, [usuario]);

  // MOTOR GLOBAL de sincronización automática mientras hay sesión:
  //  - cada 5 minutos (no menos: cuidamos la cuota diaria del Apps Script), y
  //  - cada vez que la app vuelve al frente (el usuario la abre) → datos frescos
  //    en segundos, que es lo que se siente como "tiempo real".
  // El candado interno de sincronizarTodo evita ejecuciones simultáneas.
  useEffect(() => {
    if (!usuario) return;
    const id = setInterval(() => void dispararAutoSync(), 5 * 60 * 1000);
    const alFrente = () => { if (document.visibilityState === 'visible') void dispararAutoSync(); };
    document.addEventListener('visibilitychange', alFrente);
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', alFrente); };
  }, [usuario]);

  const login = useCallback(async (username: string, clave: string): Promise<Resultado> => {
    username = username.trim();
    if (!username || !clave) return { ok: false, error: 'Completa todos los campos' };

    const bloqueo = leerBloqueo(username);
    if (bloqueo.hasta && Date.now() < bloqueo.hasta) {
      return { ok: false, error: 'Cuenta bloqueada por 15 minutos' };
    }

    const u = await db.usuarios.where('username').equals(username).first();
    if (!u) return { ok: false, error: 'Usuario no encontrado' };
    if (!u.activo) return { ok: false, error: 'Usuario desactivado. Contacta al administrador.' };

    if (!verificarClave(clave, u.password)) {
      const intentos = bloqueo.intentos + 1;
      if (intentos >= MAX_INTENTOS) {
        guardarBloqueo(username, { intentos, hasta: Date.now() + BLOQUEO_MS });
        return { ok: false, error: 'Cuenta bloqueada por 15 minutos' };
      }
      guardarBloqueo(username, { intentos, hasta: 0 });
      return { ok: false, error: `Contraseña incorrecta (intento ${intentos} de ${MAX_INTENTOS})` };
    }

    limpiarBloqueo(username);
    guardarSesionRaw({
      usuario: u.username, rol: u.rol, nombre: u.nombre_completo,
      ruta_asignada: u.ruta_asignada, timestamp: Date.now(),
    });
    setUsuario(u);
    void dispararAutoSync(); // sincroniza al iniciar sesión
    return { ok: true, usuario: u };
  }, []);

  const logout = useCallback(() => {
    borrarSesionRaw();
    setUsuario(null);
  }, []);

  const cambiarClave = useCallback(async (actual: string, nueva: string): Promise<Resultado> => {
    if (!usuario) return { ok: false, error: 'No hay sesión activa' };
    if (!verificarClave(actual, usuario.password)) return { ok: false, error: 'La contraseña actual no es correcta' };
    if (!esClaveFuerte(nueva)) return { ok: false, error: 'La nueva clave debe tener 8+ caracteres, mayúscula, minúscula, número y símbolo' };

    const actualizado: Usuario = { ...usuario, password: hashClave(nueva), debe_cambiar_clave: false };
    await db.usuarios.put(actualizado);
    setUsuario(actualizado);
    return { ok: true };
  }, [usuario]);

  return (
    <Ctx.Provider value={{ usuario, cargando, login, logout, cambiarClave }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth(): AuthCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return c;
}
