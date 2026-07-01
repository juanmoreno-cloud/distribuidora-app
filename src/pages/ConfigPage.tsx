import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { ArrowLeft, Plug, Loader2, Download, UserCog, ChevronRight, Trash2, RefreshCw, Lock } from 'lucide-react';
import { db } from '../db/database';
import { leerConfigSync, guardarConfigSync, probarConexion, syncCatalogo, syncDesdeSheets, sincronizarTodo } from '../services/googleSheets';
import { fechaLegible } from '../utils/formatters';
import { toast } from '../components/Toast';
import { useAuth } from '../auth/AuthContext';

// Pantalla de Configuración de la sincronización con Google Sheets.
// TODOS los roles pueden entrar y sincronizar; solo el ADMIN edita la URL/token.
export default function ConfigPage({ onCerrar }: { onCerrar: () => void }) {
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const esAdmin = usuario?.rol === 'admin';
  const [url, setUrl] = useState('');
  const [token, setToken] = useState('');
  const [probando, setProbando] = useState(false);
  const [bajando, setBajando] = useState(false);
  const [sincronizando, setSincronizando] = useState(false);

  const ultimaSync = useLiveQuery(() => db.configuracion.get('ultima_sync'), []);

  useEffect(() => {
    leerConfigSync().then((c) => { setUrl(c.webappUrl); setToken(c.token); });
  }, []);

  async function guardar() {
    await guardarConfigSync({ webappUrl: url, token });
    toast('Configuración guardada ✓', 'success');
  }

  async function probar() {
    await guardarConfigSync({ webappUrl: url, token });
    setProbando(true);
    try {
      await probarConexion();
      toast('Conexión exitosa con Google Sheets ✓', 'success');
    } catch (e) {
      toast('Falló la conexión: ' + (e as Error).message, 'error');
    } finally {
      setProbando(false);
    }
  }

  async function bajarDatos() {
    setBajando(true);
    try {
      const cat = await syncCatalogo();
      const cli = await syncDesdeSheets();
      toast(`Descargado: ${cat} producto(s), ${cli} cliente(s) nuevo(s).`, 'success');
    } catch (e) {
      toast('No se pudo descargar: ' + (e as Error).message, 'error');
    } finally {
      setBajando(false);
    }
  }

  // Sincronizar ahora (disponible para TODOS los roles).
  async function sincronizarAhora() {
    if (!navigator.onLine) { toast('Sin conexión. Se intentará al volver el internet.', 'info'); return; }
    setSincronizando(true);
    try {
      const r = await sincronizarTodo();
      await db.configuracion.put({ clave: 'ultima_sync', valor: new Date().toISOString() });
      const subidos = r.subeClientes + r.subePedidos;
      const bajados = r.bajaCatalogo + r.bajaClientes;
      toast(subidos + bajados > 0 ? `Sincronizado: ${subidos} subido(s), ${bajados} bajado(s).` : 'Todo está al día ✓', 'success');
    } catch (e) {
      toast('No se pudo sincronizar: ' + (e as Error).message, 'error');
    } finally {
      setSincronizando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-gray-100 overflow-y-auto">
      <header className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-2">
        <button className="btn-ghost !min-h-[40px] !px-3" onClick={onCerrar}><ArrowLeft size={18} /></button>
        <h2 className="text-lg font-bold">Configuración</h2>
      </header>

      <div className="p-4 space-y-4 max-w-2xl mx-auto">
        {/* Sincronizar ahora: disponible para TODOS los roles */}
        <button className="btn-success w-full" onClick={sincronizarAhora} disabled={sincronizando}>
          {sincronizando ? <Loader2 className="animate-spin" size={18} /> : <RefreshCw size={18} />} Sincronizar ahora
        </button>

        {/* Gestión de Usuarios y Papelera: SOLO admin */}
        {esAdmin && (
          <>
            <button
              className="card p-4 w-full flex items-center gap-3 active:scale-[0.99] transition"
              onClick={() => { onCerrar(); navigate('/usuarios'); }}
            >
              <div className="bg-red-500 text-white rounded-xl w-10 h-10 flex items-center justify-center">
                <UserCog size={20} />
              </div>
              <div className="flex-1 text-left">
                <p className="font-semibold">Gestión de Usuarios</p>
                <p className="text-xs text-gray-500">Crear, editar y activar/desactivar usuarios</p>
              </div>
              <ChevronRight size={18} className="text-gray-400" />
            </button>

            <button
              className="card p-4 w-full flex items-center gap-3 active:scale-[0.99] transition"
              onClick={() => { onCerrar(); navigate('/papelera'); }}
            >
              <div className="bg-gray-500 text-white rounded-xl w-10 h-10 flex items-center justify-center">
                <Trash2 size={20} />
              </div>
              <div className="flex-1 text-left">
                <p className="font-semibold">Papelera</p>
                <p className="text-xs text-gray-500">Restaurar o eliminar definitivamente</p>
              </div>
              <ChevronRight size={18} className="text-gray-400" />
            </button>
          </>
        )}

        <div className="card p-4 text-sm text-gray-600 space-y-1">
          <p className="font-semibold text-gray-800">Conexión con Google Sheets</p>
          <p>
            {esAdmin
              ? <>Pega aquí la URL del <b>Web App de Apps Script</b>. No se guardan claves secretas en el teléfono.</>
              : <>La conexión ya fue configurada por el administrador. Solo puedes verla y sincronizar.</>}
          </p>
        </div>

        <div>
          <label className="label">URL del Web App</label>
          <textarea className="input min-h-[72px] py-2 text-sm disabled:bg-gray-100 disabled:text-gray-500"
            value={url} disabled={!esAdmin} onChange={(e) => setUrl(e.target.value)}
            placeholder="https://script.google.com/macros/s/AKfy…/exec" />
        </div>

        <div>
          <label className="label">Token (opcional)</label>
          <input className="input disabled:bg-gray-100 disabled:text-gray-500"
            value={token} disabled={!esAdmin} onChange={(e) => setToken(e.target.value)}
            placeholder="Solo si pusiste un TOKEN en el script" />
        </div>

        {esAdmin ? (
          <div className="grid grid-cols-2 gap-3">
            <button className="btn-primary" onClick={probar} disabled={probando}>
              {probando ? <Loader2 className="animate-spin" size={18} /> : <Plug size={18} />} Probar conexión
            </button>
            <button className="btn-ghost" onClick={guardar}>Guardar</button>
          </div>
        ) : (
          <p className="text-xs text-gray-400 flex items-center gap-1"><Lock size={13} /> Solo el administrador puede editar la URL y el token.</p>
        )}

        <button className="btn-ghost w-full" onClick={bajarDatos} disabled={bajando}>
          {bajando ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />} Descargar catálogo y clientes
        </button>

        {ultimaSync?.valor != null && (
          <p className="text-xs text-gray-400 text-center">
            Última sincronización: {fechaLegible(String(ultimaSync.valor))}
          </p>
        )}
      </div>
    </div>
  );
}
