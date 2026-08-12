#!/bin/bash

echo "🚀 Iniciando configuração do Smoke Garden..."

# Criar pastas
echo "📁 Criando estrutura de pastas..."
mkdir -p frontend/src/{components/{Layout,Dashboard,Products,Services,Sales,PendingPayments,Reports},contexts,hooks,lib,pages,styles}
mkdir -p supabase/migrations
mkdir -p frontend/public

# Criar arquivos vazios
echo "📄 Criando arquivos base..."

# Frontend principal
cat > frontend/src/main.jsx << 'EOF'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/globals.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
EOF

cat > frontend/src/App.jsx << 'EOF'
import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { StoreProvider } from './contexts/StoreContext'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Products from './pages/Products'
import Services from './pages/Services'
import Sales from './pages/Sales'
import PendingPayments from './pages/PendingPayments'
import Reports from './pages/Reports'
import Settings from './pages/Settings'
import Layout from './components/Layout'

function App() {
  const [isAuthenticated, setIsAuthenticated] = React.useState(false)
  
  return (
    <AuthProvider>
      <StoreProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={isAuthenticated ? <Layout /> : <Navigate to="/login" />}>
              <Route index element={<Dashboard />} />
              <Route path="produtos" element={<Products />} />
              <Route path="servicos" element={<Services />} />
              <Route path="vendas" element={<Sales />} />
              <Route path="pendentes" element={<PendingPayments />} />
              <Route path="relatorios" element={<Reports />} />
              <Route path="configuracoes" element={<Settings />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </StoreProvider>
    </AuthProvider>
  )
}

export default App
EOF

# CSS com Tailwind e paleta de cores
cat > frontend/src/styles/globals.css << 'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --smoke: #2C2C2C;
  --garden: #3A5F40;
  --burnt-orange: #D95A1A;
  --gray-light: #E0E0E0;
  --carbon: #1A1A1A;
  --alert-red: #C62828;
  --alert-yellow: #F9A825;
  --success-green: #2E7D32;
}

body {
  background-color: var(--smoke);
  color: var(--gray-light);
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
}

.bg-smoke { background-color: var(--smoke); }
.bg-garden { background-color: var(--garden); }
.bg-carbon { background-color: var(--carbon); }
.text-garden { color: var(--garden); }
.text-burnt { color: var(--burnt-orange); }
.border-burnt { border-color: var(--burnt-orange); }
.hover-burnt:hover { background-color: var(--burnt-orange); }

.status-pending { @apply bg-yellow-600 text-white; }
.status-paid { @apply bg-green-700 text-white; }
.status-overdue { @apply bg-red-700 text-white; }
.status-partial { @apply bg-blue-700 text-white; }

.expiry-critical { @apply bg-red-900 text-red-200 border-l-4 border-red-500; }
.expiry-warning { @apply bg-yellow-900 text-yellow-200 border-l-4 border-yellow-500; }
.expiry-expired { @apply bg-red-950 text-red-300 line-through border-l-4 border-red-700; }
EOF

# Supabase client
cat > frontend/src/lib/supabase.js << 'EOF'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
EOF

# Auth Context
cat > frontend/src/contexts/AuthContext.jsx << 'EOF'
import React, { createContext, useState, useContext, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const login = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      toast.error('Erro ao fazer login: ' + error.message)
      return false
    }
    toast.success('Login realizado com sucesso!')
    return true
  }

  const logout = async () => {
    await supabase.auth.signOut()
    toast.success('Logout realizado')
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
EOF

# Layout com Sidebar
cat > frontend/src/components/Layout/Sidebar.jsx << 'EOF'
import React from 'react'
import { NavLink } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Package, 
  Wrench, 
  ShoppingCart, 
  Clock, 
  BarChart3, 
  Settings,
  LogOut
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

const menuItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/produtos', icon: Package, label: 'Produtos' },
  { path: '/servicos', icon: Wrench, label: 'Serviços' },
  { path: '/vendas', icon: ShoppingCart, label: 'Nova Venda' },
  { path: '/pendentes', icon: Clock, label: 'Pagamentos Pendentes' },
  { path: '/relatorios', icon: BarChart3, label: 'Relatórios' },
  { path: '/configuracoes', icon: Settings, label: 'Configurações' },
]

export default function Sidebar() {
  const { logout } = useAuth()

  return (
    <aside className="w-64 bg-carbon min-h-screen fixed left-0 top-0 border-r border-gray-700">
      <div className="p-4 border-b border-gray-700">
        <img src="/logo.png" alt="Smoke Garden" className="h-12 mx-auto" />
        <h1 className="text-center text-garden font-bold mt-2">Smoke Garden</h1>
        <p className="text-center text-xs text-gray-400">Mecânica 2 Tempos</p>
      </div>
      
      <nav className="mt-6">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 mx-2 rounded-lg transition-colors ${
                isActive 
                  ? 'bg-garden text-white' 
                  : 'text-gray-300 hover:bg-gray-800'
              }`
            }
          >
            <item.icon size={20} />
            <span>{item.label}</span>
          </NavLink>
        ))}
        
        <button
          onClick={logout}
          className="flex items-center gap-3 px-4 py-3 mx-2 rounded-lg text-red-400 hover:bg-red-900/30 w-full mt-10"
        >
          <LogOut size={20} />
          <span>Sair</span>
        </button>
      </nav>
    </aside>
  )
}
EOF

echo "✅ Estrutura criada com sucesso!"
echo ""
echo "📌 PRÓXIMOS PASSOS:"
echo "1. cd frontend"
echo "2. npm install"
echo "3. Crie um arquivo .env com:"
echo "   VITE_SUPABASE_URL=sua_url_do_supabase"
echo "   VITE_SUPABASE_ANON_KEY=sua_chave_anon"
echo "   VITE_STRIPE_PUBLIC_KEY=sua_chave_publica_stripe"
echo "4. Execute o schema.sql no Supabase SQL Editor"
echo "5. npm run dev"