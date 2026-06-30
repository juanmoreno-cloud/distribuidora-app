import { Routes, Route } from 'react-router-dom';
import { useSession } from './hooks/useSession';
import BottomNav from './components/BottomNav';
import { ToastContainer } from './components/Toast';
import OfflineBanner from './components/OfflineBanner';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import ClientesPage from './pages/ClientesPage';
import PedidosPage from './pages/PedidosPage';
import CargaPage from './pages/CargaPage';
import DespachoPage from './pages/DespachoPage';

export default function App() {
  const sesion = useSession();

  // Si no hay jornada iniciada, mostrar solo el login.
  if (!sesion) {
    return (
      <>
        <OfflineBanner />
        <LoginPage />
        <ToastContainer />
      </>
    );
  }

  return (
    <div className="min-h-screen max-w-2xl mx-auto pb-20">
      <OfflineBanner />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/clientes" element={<ClientesPage />} />
        <Route path="/pedidos" element={<PedidosPage />} />
        <Route path="/carga" element={<CargaPage />} />
        <Route path="/despacho" element={<DespachoPage />} />
        <Route path="*" element={<HomePage />} />
      </Routes>
      <BottomNav />
      <ToastContainer />
    </div>
  );
}
