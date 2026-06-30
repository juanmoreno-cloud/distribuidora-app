import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { seedSiVacia } from './db/database';

// Carga las semillas (productos + clientes de ejemplo) en el primer arranque.
seedSiVacia().catch((e) => console.error('Error cargando datos iniciales:', e));

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
