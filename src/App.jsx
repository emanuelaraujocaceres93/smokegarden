import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { setupErrorHandling } from './utils/errorLogger';
import Login from './pages/auth/Login';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/dashboard/Dashboard';
import Stock from './pages/stock/Stock';
import People from './pages/people/People';
import PublicMenu from './pages/public/PublicMenu';
import Orcamentos from './pages/orcamentos/Orcamentos';
import NovoOrcamento from './pages/orcamentos/NovoOrcamento';
import OrcamentoDetalhes from './pages/orcamentos/OrcamentoDetalhes';
import Sales from './pages/sales/Sales';
import Accounts from './pages/accounts/Accounts';
import Reports from './pages/reports/Reports';
import Settings from './pages/settings/Settings';
import CaixaDashboard from './pages/caixa/CaixaDashboard';
import QRCodePage from './pages/QRCodePage';
import VendaDetalhes from './pages/VendaDetalhes';
import Avaliacoes from './pages/avaliacoes/Avaliacoes';

function AppContent() {
  const { user, loading, logout } = useAuth();

  if (window.location.pathname === '/public') {
    return <PublicMenu />;
  }

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#2C2C2C',
        color: '#E0E0E0'
      }}>
        Carregando...
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <Layout user={user} onLogout={logout}>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/estoque" element={<Stock />} />
        <Route path="/products" element={<Navigate to="/estoque" replace />} />
        <Route path="/services" element={<Navigate to="/estoque" replace />} />
        <Route path="/orcamentos" element={<Orcamentos />} />
        <Route path="/orcamentos/novo" element={<NovoOrcamento />} />
        <Route path="/orcamentos/:id" element={<OrcamentoDetalhes />} />
        <Route path="/sales" element={<Sales />} />
        <Route path="/accounts" element={<Accounts />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/pessoas" element={<People />} />
        <Route path="/clients" element={<Navigate to="/pessoas" replace />} />
        <Route path="/suppliers" element={<Navigate to="/pessoas" replace />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/caixa" element={<CaixaDashboard />} />
        <Route path="/qrcode" element={<QRCodePage />} />
        <Route path="/avaliacoes" element={<Avaliacoes />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
        <Route path="/sales/:id" element={<VendaDetalhes />} />
      </Routes>
    </Layout>
  );
}

function App() {
  useEffect(() => {
    setupErrorHandling();
  }, []);

  return (
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;