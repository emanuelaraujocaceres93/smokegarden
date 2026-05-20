import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Login from './pages/auth/Login'
import Layout from './components/Layout/Layout'
import Dashboard from './pages/dashboard/Dashboard'
import Products from './pages/products/Products'
import Services from './pages/services/Services'
import Sales from './pages/sales/Sales'
import Accounts from './pages/accounts/Accounts'
import Reports from './pages/reports/Reports'
import Settings from './pages/settings/Settings'
import Clients from './pages/clients/Clients'
import Suppliers from './pages/suppliers/Suppliers'

function AppContent() {
  const { user, loading, logout } = useAuth()

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
    )
  }

  if (!user) {
    return <Login />
  }

  return (
    <Layout user={user} onLogout={logout}>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/products" element={<Products />} />
        <Route path="/services" element={<Services />} />
        <Route path="/sales" element={<Sales />} />
        <Route path="/accounts" element={<Accounts />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/clients" element={<Clients />} />
        <Route path="/suppliers" element={<Suppliers />} />
      </Routes>
    </Layout>
  )
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
