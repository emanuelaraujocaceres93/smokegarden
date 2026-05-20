import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { CartProvider } from './contexts/CartContext'
import Layout from './components/Layout/Layout'
import Dashboard from './pages/dashboard/Dashboard'
import Products from './pages/products/Products'
import Services from './pages/services/Services'
import Sales from './pages/sales/Sales'
import PendingPayments from './pages/pending/PendingPayments'
import Reports from './pages/reports/Reports'
import Clients from './pages/clients/Clients'
import Suppliers from './pages/suppliers/Suppliers'
import Login from './pages/auth/Login'
import Loading from './components/ui/Loading'

function AppRoutes() {
  const { user, loading, logout } = useAuth()

  if (loading) {
    return <Loading message="Verificando sessão..." />
  }

  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        <Route
          path="/login"
          element={!user ? <Login /> : <Navigate to="/dashboard" replace />}
        />
        <Route element={user ? <Layout user={user} onLogout={logout} /> : <Navigate to="/login" replace />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/products" element={<Products />} />
          <Route path="/services" element={<Services />} />
          <Route path="/sales" element={<Sales />} />
          <Route path="/pending" element={<PendingPayments />} />
          <Route path="/reports" element={<Reports />} />
        </Route>
        <Route path="*" element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />
      </Routes>
    </BrowserRouter>
  )
}

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <AppRoutes />
      </CartProvider>
    </AuthProvider>
  )
}

export default App

