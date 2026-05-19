import React from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Login from './pages/auth/Login'

function AppContent() {
  const { user, loading } = useAuth()

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
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#2C2C2C',
      color: '#E0E0E0'
    }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ color: '#D95A1A' }}>Dashboard</h1>
        <p>Bem-vindo, {user.email}!</p>
        <p style={{ color: '#3A5F40' }}>✅ Autenticação funcionando!</p>
        <p>Próximo passo: criar o Dashboard completo</p>
      </div>
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App