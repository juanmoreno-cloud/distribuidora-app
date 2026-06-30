import { useEffect, useState } from 'react';

// Sistema simple de avisos (toast). Se usa con: toast('Mensaje', 'success')
type TipoToast = 'success' | 'error' | 'info';
interface MsgToast {
  id: number;
  texto: string;
  tipo: TipoToast;
}

let contador = 0;
const emisor = new EventTarget();

export function toast(texto: string, tipo: TipoToast = 'success'): void {
  const detalle: MsgToast = { id: ++contador, texto, tipo };
  emisor.dispatchEvent(new CustomEvent('toast', { detail: detalle }));
}

const colores: Record<TipoToast, string> = {
  success: 'bg-green-600',
  error: 'bg-red-600',
  info: 'bg-gray-800',
};

export function ToastContainer() {
  const [mensajes, setMensajes] = useState<MsgToast[]>([]);

  useEffect(() => {
    const handler = (e: Event) => {
      const m = (e as CustomEvent<MsgToast>).detail;
      setMensajes((prev) => [...prev, m]);
      // Cada aviso desaparece a los 3.5 segundos.
      setTimeout(() => {
        setMensajes((prev) => prev.filter((x) => x.id !== m.id));
      }, 3500);
    };
    emisor.addEventListener('toast', handler);
    return () => emisor.removeEventListener('toast', handler);
  }, []);

  return (
    <div className="fixed bottom-24 left-0 right-0 z-50 flex flex-col items-center gap-2 px-4 pointer-events-none">
      {mensajes.map((m) => (
        <div
          key={m.id}
          className={`${colores[m.tipo]} text-white text-sm font-medium px-4 py-3 rounded-xl shadow-lg max-w-sm w-full text-center`}
        >
          {m.texto}
        </div>
      ))}
    </div>
  );
}
