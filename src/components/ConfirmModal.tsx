import { AlertTriangle } from 'lucide-react';
import { type ReactNode } from 'react';

interface Accion {
  texto: string;
  onClick: () => void;
  tono?: 'peligro' | 'neutro' | 'primario';
}

// Modal de confirmación reutilizable. Acepta 1 o más acciones + Cancelar.
export default function ConfirmModal({
  titulo, mensaje, acciones, onCancelar,
}: {
  titulo: string;
  mensaje: ReactNode;
  acciones: Accion[];
  onCancelar: () => void;
}) {
  const clase = (tono?: Accion['tono']) =>
    tono === 'peligro' ? 'btn bg-red-600 text-white'
      : tono === 'primario' ? 'btn-primary'
        : 'btn-ghost';

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4" onClick={onCancelar}>
      <div className="card w-full max-w-sm p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start gap-3 mb-3">
          <div className="bg-red-100 text-red-600 rounded-full w-10 h-10 flex items-center justify-center shrink-0">
            <AlertTriangle size={20} />
          </div>
          <div>
            <h3 className="font-bold text-lg">{titulo}</h3>
            <div className="text-sm text-gray-600 mt-1">{mensaje}</div>
          </div>
        </div>
        <div className="flex flex-col gap-2 mt-4">
          {acciones.map((a, i) => (
            <button key={i} className={`${clase(a.tono)} w-full`} onClick={a.onClick}>{a.texto}</button>
          ))}
          <button className="btn-ghost w-full" onClick={onCancelar}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}
