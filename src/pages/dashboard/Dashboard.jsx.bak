import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { format } from 'date-fns'

const Dashboard = () => {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalSalesMonth: 0,
    totalProducts: 0,
    lowStockProducts: 0,
    pendingPayments: 0,
    productsExpiring: 0
  })
  const [lowStockList, setLowStockList] = useState([])
  const [recentSales, setRecentSales] = useState([])

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    setLoading(true)
    
    const { data: products } = await supabase.from('products').select('*')
    const firstDayOfMonth = new Date()
    firstDayOfMonth.setDate(1)
    firstDayOfMonth.setHours(0, 0, 0, 0)
    
    const { data: sales } = await supabase
      .from('sales')
      .select('*')
      .gte('created_at', firstDayOfMonth.toISOString())
    
    const { data: installments } = await supabase
      .from('installments')
      .select('*')
      .eq('status', 'pending')
      .lt('due_date', new Date().toISOString())
    
    const lowStock = (products || []).filter(p => p.quantity <= (p.min_stock || 5))
    
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
    
    const expiring = (products || []).filter(p => {
      if (!p.has_expiry || !p.expiry_date) return false
      const expiryDate = new Date(p.expiry_date)
      return expiryDate > new Date() && expiryDate < thirtyDaysFromNow
    })
    
    const recent = (sales || [])
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 5)
    
    setStats({
      totalSalesMonth: (sales || []).reduce((sum, s) => sum + s.total_amount, 0),
      totalProducts: (products || []).length,
      lowStockProducts: lowStock.length,
      pendingPayments: (installments || []).length,
      productsExpiring: expiring.length
    })
    
    setLowStockList(lowStock.slice(0, 10))
    setRecentSales(recent)
    setLoading(false)
  }

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '40px', color: '#9CA3AF' }}>Carregando dashboard...</div>
  }

  return (
    <div style={{ padding: '16px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#D95A1A', margin: 0 }}>Dashboard</h1>
        <p style={{ color: '#9CA3AF', fontSize: '14px', marginTop: '4px' }}>Visão geral do negócio</p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '16px',
        marginBottom: '32px'
      }}>
        <div style={{ backgroundColor: '#1A1A1A', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
          <p style={{ color: '#9CA3AF', fontSize: '14px', marginBottom: '4px' }}>Vendas do Mês</p>
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#3A5F40' }}>R$ {stats.totalSalesMonth.toLocaleString('pt-BR')}</p>
        </div>
        <div style={{ backgroundColor: '#1A1A1A', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
          <p style={{ color: '#9CA3AF', fontSize: '14px', marginBottom: '4px' }}>Total Produtos</p>
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#D95A1A' }}>{stats.totalProducts}</p>
        </div>
        <div style={{ backgroundColor: '#1A1A1A', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
          <p style={{ color: '#9CA3AF', fontSize: '14px', marginBottom: '4px' }}>Estoque Baixo</p>
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#F9A825' }}>{stats.lowStockProducts}</p>
        </div>
        <div style={{ backgroundColor: '#1A1A1A', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
          <p style={{ color: '#9CA3AF', fontSize: '14px', marginBottom: '4px' }}>Pagamentos Pendentes</p>
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#C62828' }}>{stats.pendingPayments}</p>
        </div>
        <div style={{ backgroundColor: '#1A1A1A', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
          <p style={{ color: '#9CA3AF', fontSize: '14px', marginBottom: '4px' }}>Produtos a Vencer</p>
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#F9A825' }}>{stats.productsExpiring}</p>
        </div>
      </div>

      {lowStockList.length > 0 && (
        <div style={{ backgroundColor: '#1A1A1A', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
          <h3 style={{ color: '#F9A825', fontSize: '18px', marginBottom: '12px' }}>Atencao: Produtos com Estoque Baixo</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: '14px', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', color: '#9CA3AF', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <th style={{ padding: '8px' }}>Produto</th>
                  <th style={{ padding: '8px' }}>Estoque</th>
                  <th style={{ padding: '8px' }}>Minimo</th>
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

      {recentSales.length > 0 && (
        <div style={{ backgroundColor: '#1A1A1A', borderRadius: '12px', padding: '20px' }}>
          <h3 style={{ color: '#D95A1A', fontSize: '18px', marginBottom: '12px' }}>Ultimas Vendas</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: '14px', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', color: '#9CA3AF', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <th style={{ padding: '8px' }}>Data</th>
                  <th style={{ padding: '8px' }}>Cliente</th>
                  <th style={{ padding: '8px' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {recentSales.map((s) => (
                  <tr key={s.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '8px' }}>{format(new Date(s.created_at), 'dd/MM/yyyy')}</td>
                    <td style={{ padding: '8px' }}>{s.customer_name || '—'}</td>
                    <td style={{ padding: '8px' }}>R$ {s.total_amount.toFixed(2)}</td>
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