import React, { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import {
  BarChart3,
  Clock3,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Settings,
  ShoppingCart,
  Users,
  QrCode,
  Star,
  X
} from 'lucide-react'

const navigation = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { key: 'estoque', label: 'Estoque', icon: Package, path: '/estoque' },
  { key: 'orcamentos', label: 'Orçamentos', icon: FileText, path: '/orcamentos' },
  { key: 'caixa', label: 'Caixa', icon: BarChart3, path: '/caixa' },
  { key: 'sales', label: 'Vendas', icon: ShoppingCart, path: '/sales' },
  { key: 'accounts', label: 'Contas', icon: Clock3, path: '/accounts' },
  { key: 'reports', label: 'Relatórios', icon: BarChart3, path: '/reports' },
  { key: 'pessoas', label: 'Pessoas', icon: Users, path: '/pessoas' },
  { key: 'qrcode', label: 'QR Code', icon: QrCode, path: '/qrcode' },
  { key: 'avaliacoes', label: 'Avaliações', icon: Star, path: '/avaliacoes' },
  { key: 'settings', label: 'Configurações', icon: Settings, path: '/settings' }
]

export default function Layout({ user, onLogout, children }) {
  const [isDesktop, setIsDesktop] = useState(typeof window !== 'undefined' && window.innerWidth >= 1024)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false) // Começa FECHADO em todos os dispositivos
  const displayEmail = user?.email ?? 'administrador@smoke.com'

  useEffect(() => {
    const handleResize = () => {
      const desktop = window.innerWidth >= 1024
      setIsDesktop(desktop)
      // Quando redimensionar, mantém o menu fechado
      if (!desktop) {
        setIsSidebarOpen(false)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  const closeSidebar = () => {
    // Fecha o menu em TODOS os dispositivos
    setIsSidebarOpen(false)
  }

  return (
    <div className="layout-shell">
      {/* Botão do menu - visível em todos os dispositivos quando menu está fechado */}
      {!isSidebarOpen && (
        <button className="menu-toggle-btn" onClick={toggleSidebar}>
          <Menu size={20} />
          Menu
        </button>
      )}

      {/* Sidebar */}
      <aside className={`layout-sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
        <div className="layout-sidebar-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h1>Smoke Garden</h1>
            <button 
              onClick={closeSidebar}
              style={{ 
                background: 'transparent', 
                border: 'none', 
                color: 'white', 
                cursor: 'pointer',
                padding: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X size={24} />
            </button>
          </div>
          <p>Mecânica 2 Tempos</p>
        </div>

        <nav className="sidebar-nav">
          {navigation.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.key}
                to={item.path}
                className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
                onClick={closeSidebar}
              >
                <Icon size={18} />
                {item.label}
              </NavLink>
            )
          })}
        </nav>

        <div className="layout-sidebar-footer">
          <div className="sidebar-user">
            <span>Conectado como</span>
            <strong>{displayEmail}</strong>
          </div>
          <button type="button" className="sidebar-button" onClick={onLogout}>
            <LogOut size={18} />
            Sair
          </button>
        </div>
      </aside>

      {/* Overlay para fechar sidebar quando clicar fora */}
      {isSidebarOpen && (
        <div className="layout-overlay" onClick={closeSidebar} />
      )}

      {/* Conteúdo principal */}
      <div className="layout-content">
        <header className="page-header">
          <div>
            <p className="page-description">Painel de controle</p>
            <h1 className="page-title">Smoke Garden</h1>
          </div>
          <div className="card-actions">
            <div className="badge badge-muted">
              {displayEmail}
            </div>
          </div>
        </header>
        <main className="page-main">
          {children}
        </main>
      </div>
    </div>
  )
}