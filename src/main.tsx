import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { seedSiVacia } from './db/database';
import { AuthProvider } from './auth/AuthContext';

// Carga las semillas (productos, clientes y usuarios) en el primer arranque.
seedSiVacia().catch((e) => console.error('Error cargando datos iniciales:', e));

// Auto-actualización de la PWA: cuando llega una versión nueva, el service
// worker nuevo toma el control y recargamos UNA vez para usarla de inmediato
// (sin esto, el teléfono podía quedarse con la versión vieja en caché).
if ('serviceWorker' in navigator) {
  let yaRecargo = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (yaRecargo) return;
    yaRecargo = true;
    window.location.reload();
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
