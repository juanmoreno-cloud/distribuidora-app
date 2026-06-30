import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { ArrowLeft, Plug, Loader2, Download } from 'lucide-react';
import { db } from '../db/database';
import { leerConfigSync, guardarConfigSync, probarConexion, syncCatalogo, syncDesdeSheets } from '../services/googleSheets';
import { fechaLegible } from '../utils/formatters';
import { toast } from '../components/Toast';

// Pantalla de Configuración de la sincronización con Google Sheets.
export default function ConfigPage({ onCerrar }: { onCerrar: () => void }) {
  const [url, setUrl] = useState('');
  const [token, setToken] = useState('');
  const [probando, setProbando] = useState(false);
  const [bajando, setBajando] = useState(false);

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

  return (
    <div className="fixed inset-0 z-50 bg-gray-100 overflow-y-auto">
      <header className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-2">
        <button className="btn-ghost !min-h-[40px] !px-3" onClick={onCerrar}><ArrowLeft size={18} /></button>
        <h2 className="text-lg font-bold">Configuración</h2>
      </header>

      <div className="p-4 space-y-4 max-w-2xl mx-auto">
        <div className="card p-4 text-sm text-gray-600 space-y-1">
          <p className="font-semibold text-gray-800">Conexión con Google Sheets</p>
          <p>Pega aquí la URL del <b>Web App de Apps Script</b> (ver instrucciones en el README). No se guardan claves secretas en el teléfono.</p>
        </div>

        <div>
          <label className="label">URL del Web App</label>
          <textarea className="input min-h-[72px] py-2 text-sm" value={url} onChange={(e) => setUrl(e.target.value)}
            placeholder="https://script.google.com/macros/s/AKfy…/exec" />
        </div>

        <div>
          <label className="label">Token (opcional)</label>
          <input className="input" value={token} onChange={(e) => setToken(e.target.value)}
            placeholder="Solo si pusiste un TOKEN en el script" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button className="btn-primary" onClick={probar} disabled={probando}>
            {probando ? <Loader2 className="animate-spin" size={18} /> : <Plug size={18} />} Probar conexión
          </button>
          <button className="btn-ghost" onClick={guardar}>Guardar</button>
        </div>

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
