import React, { useEffect, useState } from 'react'
import { Users, Truck,  NavLink, Outlet } from 'react-router-dom'
import { Users, Truck, 
  BarChart3,
  Clock3,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  ShoppingCart,
  Wrench
} from 'lucide-react'

const navigation = [
    { key: 'clients', label: 'Clientes', icon: Users, path: '/clients' },
  { key: 'suppliers', label: 'Fornecedores', icon: Truck, path: '/suppliers' },
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { key: 'products', label: 'Produtos', icon: Package, path: '/products' },
  { key: 'services', label: 'Serviços', icon: Wrench, path: '/services' },
  { key: 'sales', label: 'Vendas', icon: ShoppingCart, path: '/sales' },
  { key: 'pending', label: 'Pagamentos', icon: Clock3, path: '/pending' },
  { key: 'reports', label: 'Relatórios', icon: BarChart3, path: '/reports' }
]

export default function Layout({ user, onLogout }) {
  const [isDesktop, setIsDesktop] = useState(typeof window !== 'undefined' && window.innerWidth >= 1024)
  const [isSidebarOpen, setIsSidebarOpen] = useState(typeof window !== 'undefined' && window.innerWidth >= 1024)
  const displayEmail = user?.email ?? 'administrador@smoke.com'

  useEffect(() => {
    const handleResize = () => {
      const desktop = window.innerWidth >= 1024
      setIsDesktop(desktop)
      if (desktop) {
        setIsSidebarOpen(true)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <div className="layout-shell">
      <aside className={`layout-sidebar ${isSidebarOpen ? 'open' : 'closed'} ${!isDesktop ? 'mobile' : ''}`}>
        <div className="layout-sidebar-header">
          <div>
            <h1>Smoke Garden</h1>
            <p>Mecânica 2 Tempos</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navigation.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.key}
                to={item.path}
                className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
                onClick={() => {
                  if (!isDesktop) {
                    setIsSidebarOpen(false)
                  }
                }}
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

      {!isDesktop && isSidebarOpen ? <div className="layout-overlay" onClick={() => setIsSidebarOpen(false)} /> : null}

      <div className="layout-content">
        <header className="page-header">
          <div>
            <p className="page-description">Painel de controle</p>
            <h1 className="page-title">Smoke Garden</h1>
          </div>
          <div className="card-actions">
            {!isDesktop && (
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setIsSidebarOpen(true)}>
                <Menu size={16} />
                Menu
              </button>
            )}
            <div className="badge badge-muted">{displayEmail}</div>
          </div>
        </header>
        <main className="page-main">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
