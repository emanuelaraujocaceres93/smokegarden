import React, { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { setupErrorHandling } from './utils/errorLogger';
import Login from './pages/auth/Login';
import Layout from './components/Layout/Layout';
import PublicMenu from './pages/public/PublicMenu';

// Lazy loading - carrega apenas quando necessário
const Dashboard = lazy(() => import('./pages/dashboard/Dashboard'));
const Stock = lazy(() => import('./pages/stock/Stock'));
const People = lazy(() => import('./pages/people/People'));
const Orcamentos = lazy(() => import('./pages/orcamentos/Orcamentos'));
const NovoOrcamento = lazy(() => import('./pages/orcamentos/NovoOrcamento'));
const OrcamentoDetalhes = lazy(() => import('./pages/orcamentos/OrcamentoDetalhes'));
const Sales = lazy(() => import('./pages/sales/Sales'));
const Accounts = lazy(() => import('./pages/accounts/Accounts'));
const Reports = lazy(() => import('./pages/reports/Reports'));
const Settings = lazy(() => import('./pages/settings/Settings'));
const CaixaDashboard = lazy(() => import('./pages/caixa/CaixaDashboard'));
const QRCodePage = lazy(() => import('./pages/QRCodePage'));
const VendaDetalhes = lazy(() => import('./pages/VendaDetalhes'));
const Avaliacoes = lazy(() => import('./pages/avaliacoes/Avaliacoes'));

// Componente de loading
const PageLoader = () => (
  <div style={{
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2C2C2C',
    color: '#D95A1A'
  }}>
    <div style={{ textAlign: 'center' }}>
      <div style={{
        width: '40px',
        height: '40px',
        border: '3px solid rgba(217, 90, 26, 0.2)',
        borderTopColor: '#D95A1A',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        marginBottom: '12px'
      }} />
      <p>Carregando...</p>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  </div>
);

function AppContent() {
  const { user, loading, logout } = useAuth();

  if (window.location.pathname === '/public') {
    return <PublicMenu />;
  }

  if (loading) {
    return <PageLoader />;
  }

  if (!user) {
    return <Login />;
  }

  return (
    <Layout user={user} onLogout={logout}>
      <Suspense fallback={<PageLoader />}>
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
          <Route path="/sales/:id" element={<VendaDetalhes />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
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