import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { seedSiVacia } from './db/database';
import { AuthProvider } from './auth/AuthContext';

// Carga las semillas (productos, clientes y usuarios) en el primer arranque.
seedSiVacia().catch((e) => console.error('Error cargando datos iniciales:', e));

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
