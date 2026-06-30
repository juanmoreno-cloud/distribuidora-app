import { useState } from 'react';
import { MapPin, Camera, Save, X, Loader2 } from 'lucide-react';
import {
  TIPOS_CLIENTE, ZONAS, ESTADOS_CLIENTE, TIPOS_PAGO, VENDEDORES, RUTAS,
  type Cliente, type TipoCliente, type Zona, type EstadoCliente, type TipoPago, type Vendedor, type Ruta,
} from '../types';
import { db } from '../db/database';
import { obtenerUbicacion } from '../services/geolocation';
import { archivoABase64 } from '../utils/imagenes';
import { esRifValido, esTelefonoValido } from '../utils/validators';
import { toast } from './Toast';
import { leerSesion } from '../hooks/useSession';

// Formulario para registrar un cliente nuevo (offline-first).
export default function ClienteForm({ onCerrar }: { onCerrar: () => void }) {
  const sesion = leerSesion();
  const [f, setF] = useState({
    razon_social: '',
    nombre_fantasia: '',
    rif: '',
    telefono: '',
    direccion: '',
    tipo_cliente: '' as TipoCliente | '',
    zona: '' as Zona | '',
    estado: 'Potencial' as EstadoCliente,
    tipo_pago: 'Contado' as TipoPago,
    limite_credito: 0,
    contacto_nombre: '',
    observaciones: '',
    vendedor_asignado: (sesion?.vendedor ?? '') as Vendedor | '',
    ruta: (sesion?.ruta ?? '') as Ruta | '',
  });
  const [lat, setLat] = useState<number | undefined>();
  const [lng, setLng] = useState<number | undefined>();
  const [fotos, setFotos] = useState<string[]>([]);
  const [gpsCargando, setGpsCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);

  function set<K extends keyof typeof f>(campo: K, valor: (typeof f)[K]) {
    setF((prev) => ({ ...prev, [campo]: valor }));
  }

  async function capturarGps() {
    setGpsCargando(true);
    try {
      const { latitud, longitud } = await obtenerUbicacion();
      setLat(latitud);
      setLng(longitud);
      toast('Ubicación capturada ✓', 'success');
    } catch (e) {
      toast((e as Error).message, 'error');
    } finally {
      setGpsCargando(false);
    }
  }

  async function agregarFotos(files: FileList | null) {
    if (!files) return;
    try {
      const nuevas = await Promise.all(Array.from(files).map((file) => archivoABase64(file)));
      setFotos((prev) => [...prev, ...nuevas]);
    } catch (e) {
      toast((e as Error).message, 'error');
    }
  }

  async function guardar() {
    // Validaciones mínimas
    if (!f.razon_social.trim() && !f.nombre_fantasia.trim()) {
      toast('Escribe al menos la razón social o el nombre.', 'error');
      return;
    }
    const rif = f.rif.trim().toUpperCase() || 'SIN RIF';
    if (!esRifValido(rif)) {
      toast('RIF inválido. Ej: J-12345678-9 (o escribe SIN RIF).', 'error');
      return;
    }
    if (f.telefono.trim() && !esTelefonoValido(f.telefono)) {
      toast('Teléfono inválido (mínimo 7 dígitos).', 'error');
      return;
    }

    setGuardando(true);
    try {
      // id: usa el RIF si es válido y único; si no, genera uno.
      let id = rif !== 'SIN RIF' ? rif : `cli-${crypto.randomUUID()}`;
      if (await db.clientes.get(id)) id = `cli-${crypto.randomUUID()}`;

      const cliente: Cliente = {
        id,
        razon_social: f.razon_social.trim(),
        nombre_fantasia: f.nombre_fantasia.trim() || f.razon_social.trim(),
        rif,
        telefono: f.telefono.trim(),
        direccion: f.direccion.trim(),
        tipo_cliente: f.tipo_cliente,
        zona: f.zona,
        estado: f.estado,
        tipo_pago: f.tipo_pago,
        limite_credito: f.tipo_pago === 'Crédito' ? Number(f.limite_credito) || 0 : 0,
        contacto_nombre: f.contacto_nombre.trim(),
        observaciones: f.observaciones.trim(),
        vendedor_asignado: f.vendedor_asignado,
        ruta: f.ruta,
        latitud: lat,
        longitud: lng,
        fecha_registro: new Date().toISOString(),
        sincronizado: false, // se subirá a Google Sheets cuando haya internet
        fotos_soportes: fotos,
      };

      await db.clientes.add(cliente);
      toast('Cliente guardado localmente. Se sincronizará cuando haya internet.', 'success');
      onCerrar();
    } catch (e) {
      toast('Error guardando: ' + (e as Error).message, 'error');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-gray-100 overflow-y-auto">
      <header className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <h2 className="text-lg font-bold">Nuevo Cliente</h2>
        <button className="btn-ghost !min-h-[40px]" onClick={onCerrar}><X size={18} /></button>
      </header>

      <div className="p-4 space-y-4 max-w-2xl mx-auto pb-32">
        <div>
          <label className="label">Razón Social</label>
          <input className="input" value={f.razon_social} onChange={(e) => set('razon_social', e.target.value)} placeholder="Nombre legal de la empresa" />
        </div>
        <div>
          <label className="label">Nombre Fantasía</label>
          <input className="input" value={f.nombre_fantasia} onChange={(e) => set('nombre_fantasia', e.target.value)} placeholder="Como se conoce el negocio" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">RIF</label>
            <input className="input" value={f.rif} onChange={(e) => set('rif', e.target.value)} placeholder="J-12345678-9" />
          </div>
          <div>
            <label className="label">Teléfono</label>
            <input className="input" inputMode="tel" value={f.telefono} onChange={(e) => set('telefono', e.target.value)} placeholder="0412-1234567" />
          </div>
        </div>
        <div>
          <label className="label">Dirección</label>
          <textarea className="input min-h-[72px] py-2" value={f.direccion} onChange={(e) => set('direccion', e.target.value)} placeholder="Punto de referencia, calle, local…" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Tipo de Cliente</label>
            <select className="input" value={f.tipo_cliente} onChange={(e) => set('tipo_cliente', e.target.value as TipoCliente)}>
              <option value="">Selecciona…</option>
              {TIPOS_CLIENTE.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Zona</label>
            <select className="input" value={f.zona} onChange={(e) => set('zona', e.target.value as Zona)}>
              <option value="">Selecciona…</option>
              {ZONAS.map((z) => <option key={z} value={z}>{z}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Estado</label>
            <select className="input" value={f.estado} onChange={(e) => set('estado', e.target.value as EstadoCliente)}>
              {ESTADOS_CLIENTE.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Tipo de Pago</label>
            <select className="input" value={f.tipo_pago} onChange={(e) => set('tipo_pago', e.target.value as TipoPago)}>
              {TIPOS_PAGO.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>
        {f.tipo_pago === 'Crédito' && (
          <div>
            <label className="label">Límite de crédito ($)</label>
            <input className="input" type="number" inputMode="decimal" value={f.limite_credito} onChange={(e) => set('limite_credito', Number(e.target.value))} />
          </div>
        )}
        <div>
          <label className="label">Contacto / Dueño</label>
          <input className="input" value={f.contacto_nombre} onChange={(e) => set('contacto_nombre', e.target.value)} placeholder="Persona de contacto" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Vendedor asignado</label>
            <select className="input" value={f.vendedor_asignado} onChange={(e) => set('vendedor_asignado', e.target.value as Vendedor)}>
              <option value="">Selecciona…</option>
              {VENDEDORES.map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Ruta</label>
            <select className="input" value={f.ruta} onChange={(e) => set('ruta', e.target.value as Ruta)}>
              <option value="">Selecciona…</option>
              {RUTAS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="label">Observaciones</label>
          <textarea className="input min-h-[64px] py-2" value={f.observaciones} onChange={(e) => set('observaciones', e.target.value)} />
        </div>

        {/* GPS y fotos */}
        <div className="grid grid-cols-2 gap-3">
          <button type="button" className="btn-ghost" onClick={capturarGps} disabled={gpsCargando}>
            {gpsCargando ? <Loader2 className="animate-spin" size={18} /> : <MapPin size={18} />}
            {lat ? 'Ubicación ✓' : 'Ubicación GPS'}
          </button>
          <label className="btn-ghost cursor-pointer">
            <Camera size={18} /> Fotos {fotos.length > 0 && `(${fotos.length})`}
            <input type="file" accept="image/*" multiple capture="environment" className="hidden" onChange={(e) => agregarFotos(e.target.files)} />
          </label>
        </div>
        {lat && <p className="text-xs text-gray-500">📍 {lat.toFixed(6)}, {lng?.toFixed(6)}</p>}
        {fotos.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {fotos.map((src, i) => (
              <div key={i} className="relative">
                <img src={src} className="w-16 h-16 object-cover rounded-lg border" alt={`foto ${i + 1}`} />
                <button type="button" onClick={() => setFotos((p) => p.filter((_, j) => j !== i))}
                  className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">×</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Barra inferior fija con el botón guardar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 max-w-2xl mx-auto">
        <button className="btn-success w-full" onClick={guardar} disabled={guardando}>
          {guardando ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} GUARDAR CLIENTE
        </button>
      </div>
    </div>
  );
}
