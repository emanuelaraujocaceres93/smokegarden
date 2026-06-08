import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { format } from 'date-fns'

const Dashboard = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalSalesMonth: 0,
    totalProducts: 0,
    totalServices: 0,
    lowStockProducts: 0,
    pendingPayments: 0,
    productsExpiring: 0
  })
  const [lowStockList, setLowStockList] = useState([])
  const [expiringList, setExpiringList] = useState([])
  const [recentSales, setRecentSales] = useState([])

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    setLoading(true)
    
    const { data: estoque } = await supabase.from('estoque').select('*')
    const products = (estoque || []).filter((item) => item.tipo === 'produto')
    const services = (estoque || []).filter((item) => item.tipo === 'servico')
    const installments = []
    
    const firstDayOfMonth = new Date()
    firstDayOfMonth.setDate(1)
    firstDayOfMonth.setHours(0, 0, 0, 0)
    
    const { data: sales } = await supabase
      .from('vendas')
      .select('*')
      .gte('created_at', firstDayOfMonth.toISOString())
    
    const lowStock = []
    
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
    
    const expiring = []
    
    const recent = (sales || [])
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 5)
    
    setStats({
      totalSalesMonth: (sales || []).reduce((sum, s) => sum + (s.valor_total || 0), 0),
      totalProducts: (products || []).length,
      totalServices: (services || []).length,
      lowStockProducts: lowStock.length,
      pendingPayments: (installments || []).length,
      productsExpiring: expiring.length
    })
    
    setLowStockList(lowStock.slice(0, 10))
    setExpiringList(expiring.slice(0, 10))
    setRecentSales(recent)
    setLoading(false)
  }

  const handleCardClick = (type) => {
    switch(type) {
      case 'sales':
        navigate('/reports')
        break
      case 'products':
        navigate('/estoque')
        break
      case 'services':
        navigate('/estoque')
        break
      case 'lowStock':
        navigate('/estoque')
        break
      case 'pending':
        navigate('/pending')
        break
      case 'expiring':
        navigate('/estoque')
        break
      default:
        break
    }
  }

  const formatCurrency = (value) => {
    return 'R$ ' + value.toLocaleString('pt-BR')
  }

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '40px', color: '#9CA3AF' }}>Carregando dashboard...</div>
  }

  const StatCard = ({ label, value, color, onClick, icon }) => (
    <div
      onClick={onClick}
      style={{
        backgroundColor: '#1A1A1A',
        borderRadius: '12px',
        padding: '16px',
        textAlign: 'center',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s ease',
        border: '1px solid rgba(255,255,255,0.08)'
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = 'translateY(-4px)'
          e.currentTarget.style.borderColor = '#D95A1A'
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
      }}
    >
      {icon && <div style={{ fontSize: '24px', marginBottom: '8px' }}>{icon}</div>}
      <p style={{ color: '#9CA3AF', fontSize: '14px', marginBottom: '4px' }}>{label}</p>
      <p style={{ fontSize: '24px', fontWeight: 'bold', color: color, margin: 0 }}>{value}</p>
    </div>
  )

  return (
    <div style={{ padding: '16px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#D95A1A', margin: 0 }}>Dashboard</h1>
        <p style={{ color: '#9CA3AF', fontSize: '14px', marginTop: '4px' }}>Clique nos cards para navegar</p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: '16px',
        marginBottom: '32px'
      }}>
        <StatCard
          label="Vendas do Mês"
          value={formatCurrency(stats.totalSalesMonth)}
          color="#3A5F40"
          onClick={() => handleCardClick('sales')}
          icon="??"
        />
        <StatCard
          label="Total Produtos"
          value={stats.totalProducts}
          color="#D95A1A"
          onClick={() => handleCardClick('products')}
          icon="??"
        />
        <StatCard
          label="total Serviços"
          value={stats.totalServices}
          color="#D95A1A"
          onClick={() => handleCardClick('services')}
          icon="??"
        />
        <StatCard
          label="Estoque Baixo"
          value={stats.lowStockProducts}
          color="#F9A825"
          onClick={() => handleCardClick('lowStock')}
          icon="??"
        />
        <StatCard
          label="Pagamentos Pendentes"
          value={stats.pendingPayments}
          color="#C62828"
          onClick={() => handleCardClick('pending')}
          icon="??"
        />
        <StatCard
          label="Produtos a Vencer"
          value={stats.productsExpiring}
          color="#F9A825"
          onClick={() => handleCardClick('expiring')}
          icon="?"
        />
      </div>

      {lowStockList.length > 0 && (
        <div style={{ backgroundColor: '#1A1A1A', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
          <h3 style={{ color: '#F9A825', fontSize: '18px', marginBottom: '12px' }}>?? Produtos com Estoque Baixo</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: '14px', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', color: '#9CA3AF', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <th style={{ padding: '8px' }}>Produto</th>
                  <th style={{ padding: '8px' }}>Estoque</th>
                  <th style={{ padding: '8px' }}>Mínimo</th>
                </tr>
              </thead>
              <tbody>
                {lowStockList.map((p) => (
                  <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '8px' }}>{p.name}</td>
                    <td style={{ padding: '8px', color: '#F9A825' }}>{p.quantity}</td>
                    <td style={{ padding: '8px' }}>{p.min_stock || 5}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {expiringList.length > 0 && (
        <div style={{ backgroundColor: '#1A1A1A', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
          <h3 style={{ color: '#F9A825', fontSize: '18px', marginBottom: '12px' }}>? Produtos Prçximos ao Vencimento</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: '14px', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', color: '#9CA3AF', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <th style={{ padding: '8px' }}>Produto</th>
                  <th style={{ padding: '8px' }}>Validade</th>
                </tr>
              </thead>
              <tbody>
                {expiringList.map((p) => (
                  <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '8px' }}>{p.name}</td>
                    <td style={{ padding: '8px', color: '#F9A825' }}>{format(new Date(p.expiry_date), 'dd/MM/yyyy')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {recentSales.length > 0 && (
        <div style={{ backgroundColor: '#1A1A1A', borderRadius: '12px', padding: '20px' }}>
          <h3 style={{ color: '#D95A1A', fontSize: '18px', marginBottom: '12px' }}>Últimas Vendas</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: '14px', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', color: '#9CA3AF', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <th style={{ padding: '8px' }}>Data</th>
                  <th style={{ padding: '8px' }}>Cliente</th>
                  <th style={{ padding: '8px' }}>total</th>
                </tr>
              </thead>
              <tbody>
                {recentSales.map((s) => (
                  <tr key={s.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '8px' }}>{format(new Date(s.created_at), 'dd/MM/yyyy')}</td>
                    <td style={{ padding: '8px' }}>{s.cliente_id ? s.cliente_id.slice(0, 8) : '-'}</td>
                    <td style={{ padding: '8px' }}>{formatCurrency(s.valor_total || 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard
