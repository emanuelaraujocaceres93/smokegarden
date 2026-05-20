import React, { useEffect, useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import {
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
    <>
      <style>{`
        .layout-shell { display: flex; min-height: 100vh; background-color: #2C2C2C; }
        .layout-sidebar { position: fixed; top: 0; left: 0; width: 280px; height: 100vh; background-color: #1A1A1A; display: flex; flex-direction: column; transition: transform 0.3s ease; z-index: 1000; overflow-y: auto; }
        .layout-sidebar.closed { transform: translateX(-100%); }
        .layout-sidebar.open { transform: translateX(0); }
        @media (min-width: 1024px) { .layout-sidebar { transform: translateX(0) !important; } .layout-sidebar.closed { transform: translateX(0) !important; } }
        .layout-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(0, 0, 0, 0.6); z-index: 999; animation: fadeIn 0.3s ease; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .layout-sidebar-header { padding: 24px 20px; border-bottom: 1px solid #2C2C2C; text-align: center; }
        .layout-sidebar-header h1 { color: #D95A1A; font-size: 20px; font-weight: bold; margin: 0 0 4px 0; }
        .layout-sidebar-header p { color: #E0E0E0; font-size: 12px; margin: 0; }
        .sidebar-nav { flex: 1; padding: 20px 16px; display: flex; flex-direction: column; gap: 8px; }
        .sidebar-link { display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-radius: 10px; color: #E0E0E0; text-decoration: none; transition: all 0.2s ease; font-size: 14px; }
        .sidebar-link:hover { background-color: rgba(58, 95, 64, 0.2); color: #3A5F40; }
        .sidebar-link.active { background-color: #3A5F40; color: white; }
        .layout-sidebar-footer { padding: 20px; border-top: 1px solid #2C2C2C; }
        .sidebar-user { margin-bottom: 16px; padding: 8px; text-align: center; }
        .sidebar-user span { display: block; font-size: 11px; color: #9CA3AF; margin-bottom: 4px; }
        .sidebar-user strong { display: block; font-size: 12px; color: #E0E0E0; word-break: break-all; }
        .sidebar-button { width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px; padding: 10px; background: transparent; border: 1px solid #C62828; border-radius: 8px; color: #C62828; font-size: 14px; cursor: pointer; transition: all 0.2s ease; }
        .sidebar-button:hover { background-color: rgba(198, 40, 40, 0.1); }
        .layout-content { flex: 1; margin-left: 0; transition: margin-left 0.3s ease; }
        @media (min-width: 1024px) { .layout-content { margin-left: 280px; } }
        .page-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; background-color: #1A1A1A; border-bottom: 1px solid #2C2C2C; flex-wrap: wrap; gap: 12px; }
        .page-title { font-size: 24px; font-weight: bold; color: #D95A1A; margin: 0; }
        .page-description { font-size: 14px; color: #9CA3AF; margin: 0 0 4px 0; }
        .card-actions { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
        .btn { display: inline-flex; align-items: center; gap: 8px; padding: 8px 16px; border: none; border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.2s ease; }
        .btn-secondary { background-color: #2C2C2C; color: #E0E0E0; }
        .btn-secondary:hover { background-color: #3A3A3A; }
        .btn-sm { padding: 6px 12px; font-size: 12px; }
        .badge { display: inline-flex; align-items: center; padding: 6px 12px; border-radius: 20px; font-size: 12px; background-color: #2C2C2C; color: #E0E0E0; }
        .page-main { padding: 24px; min-height: calc(100vh - 80px); }
        @media (max-width: 768px) { 
          .page-header { flex-direction: column; align-items: flex-start; padding: 16px; } 
          .card-actions { width: 100%; justify-content: space-between; } 
          .page-main { padding: 16px; } 
          .page-title { font-size: 20px; } 
        }
      `}</style>

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
    </>
  )
}