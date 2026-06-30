import { type ReactNode } from 'react';

// Encabezado comun para las pantallas internas.
export default function PageHeader({ titulo, accion }: { titulo: string; accion?: ReactNode }) {
  return (
    <header className="sticky top-0 z-30 bg-gray-100/95 backdrop-blur px-4 py-3 flex items-center justify-between border-b border-gray-200">
      <h1 className="text-lg font-bold">{titulo}</h1>
      {accion}
    </header>
  );
}
