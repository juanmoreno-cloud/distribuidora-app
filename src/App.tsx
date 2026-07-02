import { Routes, Route, Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from './auth/AuthContext';
import { PERMISOS } from './auth/permisos';
import BottomNav from './components/BottomNav';
import { ToastContainer } from './components/Toast';
import OfflineBanner from './components/OfflineBanner';
import RequireRol from './components/RequireRol';
import LoginPage from './pages/LoginPage';
import CambiarClavePage from './pages/CambiarClavePage';
import HomePage from './pages/HomePage';
import ClientesPage from './pages/ClientesPage';
import PedidosPage from './pages/PedidosPage';
import CargaPage from './pages/CargaPage';
import DespachoPage from './pages/DespachoPage';
import UsuariosPage from './pages/UsuariosPage';
import PapeleraPage from './pages/PapeleraPage';
import CatalogoPage from './pages/CatalogoPage';

export default function App() {
  const { usuario, cargando } = useAuth();

  // Mientras se restaura la sesión guardada.
  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400">
        <Loader2 className="animate-spin" size={28} />
      </div>
    );
  }

  // Sin sesión → login.
  if (!usuario) {
    return (
      <>
        <OfflineBanner />
        <Routes>
          <Route path="*" element={<LoginPage />} />
        </Routes>
        <ToastContainer />
      </>
    );
  }

  // Debe cambiar la clave temporal antes de entrar.
  if (usuario.debe_cambiar_clave) {
    return (
      <>
        <OfflineBanner />
        <Routes>
          <Route path="*" element={<CambiarClavePage />} />
        </Routes>
        <ToastContainer />
      </>
    );
  }

  // App con rutas protegidas según el rol.
  return (
    <div className="min-h-screen max-w-2xl mx-auto pb-20">
      <OfflineBanner />
      <Routes>
        <Route path="/" element={<RequireRol><HomePage /></RequireRol>} />
        <Route path="/clientes" element={<RequireRol><ClientesPage /></RequireRol>} />
        <Route path="/pedidos" element={<RequireRol><PedidosPage /></RequireRol>} />
        <Route path="/carga" element={<RequireRol><CargaPage /></RequireRol>} />
        <Route path="/despacho" element={<RequireRol><DespachoPage /></RequireRol>} />
        <Route path="/usuarios" element={<RequireRol><UsuariosPage /></RequireRol>} />
        <Route path="/papelera" element={<RequireRol><PapeleraPage /></RequireRol>} />
        <Route path="/catalogo" element={<RequireRol><CatalogoPage /></RequireRol>} />
        <Route path="*" element={<Navigate to={PERMISOS[usuario.rol].rutaInicial} replace />} />
      </Routes>
      <BottomNav />
      <ToastContainer />
    </div>
  );
}
