import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { format } from 'date-fns'

const Dashboard = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalSalesMonth: 0,
    totalProducts: 0,
    totalServices: 0,
    lowStockProducts: 0,
    pendingPayments: 0
  })
  const [lowStockList, setLowStockList] = useState([])
  const [recentSales, setRecentSales] = useState([])

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    setLoading(true)
    
    try {
      const { data: estoque } = await supabase.from('estoque').select('*')
      const products = (estoque || []).filter((item) => item.tipo === 'produto')
      const services = (estoque || []).filter((item) => item.tipo === 'servico')
      
      // Produtos com estoque baixo (quantidade <= estoque_minimo)
      const lowStock = (estoque || []).filter((item) => 
        item.tipo === 'produto' && (item.quantidade || 0) <= (item.estoque_minimo || 5)
      )
      
      const firstDayOfMonth = new Date()
      firstDayOfMonth.setDate(1)
      firstDayOfMonth.setHours(0, 0, 0, 0)
      
      const { data: sales } = await supabase
        .from('vendas')
        .select('*')
        .gte('created_at', firstDayOfMonth.toISOString())
      
      const recent = (sales || [])
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5)
      
      const recentWithNames = await Promise.all(recent.map(async (sale) => {
        let clienteNome = 'Cliente avulso'
        
        if (sale.cliente_id) {
          const { data: pessoa } = await supabase
            .from('pessoas')
            .select('nome')
            .eq('id', sale.cliente_id)
            .single()
          
          if (pessoa?.nome) {
            clienteNome = pessoa.nome
          }
        } else if (sale.cliente_nome) {
          clienteNome = sale.cliente_nome
        }
        
        return {
          ...sale,
          cliente_nome: clienteNome
        }
      }))
      
      const { data: installments } = await supabase
        .from('installments')
        .select('*')
        .eq('status', 'pending')
      
      setStats({
        totalSalesMonth: (sales || []).reduce((sum, s) => sum + (s.total || s.valor_total || 0), 0),
        totalProducts: (products || []).length,
        totalServices: (services || []).length,
        lowStockProducts: lowStock.length,
        pendingPayments: (installments || []).length
      })
      
      setLowStockList(lowStock.slice(0, 10))
      setRecentSales(recentWithNames)
      
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error)
    } finally {
      setLoading(false)
    }
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
        navigate('/accounts')
        break
      default:
        break
    }
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0)
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
      <div style={{ fontSize: '28px', marginBottom: '8px' }}>{icon}</div>
      <p style={{ color: '#9CA3AF', fontSize: '14px', marginBottom: '4px' }}>{label}</p>
      <p style={{ fontSize: '24px', fontWeight: 'bold', color: color, margin: 0 }}>{value}</p>
    </div>
  )

  return (
    <div style={{ padding: '20px', backgroundColor: '#1a1a1a', minHeight: '100vh' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#D95A1A', margin: 0 }}>Dashboard</h1>
        <p style={{ color: '#9CA3AF', fontSize: '14px', marginTop: '4px' }}>Clique nos cards para navegar</p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '32px'
      }}>
        <StatCard label="Vendas do Mês" value={formatCurrency(stats.totalSalesMonth)} color="#4ade80" onClick={() => handleCardClick('sales')} icon="💰" />
        <StatCard label="Total de produtos" value={stats.totalProducts} color="#D95A1A" onClick={() => handleCardClick('products')} icon="📦" />
        <StatCard label="Total Serviços" value={stats.totalServices} color="#D95A1A" onClick={() => handleCardClick('services')} icon="🔧" />
        <StatCard label="Estoque baixo" value={stats.lowStockProducts} color="#fbbf24" onClick={() => handleCardClick('lowStock')} icon="⚠️" />
        <StatCard label="Pagamentos Pendentes" value={stats.pendingPayments} color="#f87171" onClick={() => handleCardClick('pending')} icon="📋" />
      </div>

      {lowStockList.length > 0 && (
        <div style={{ backgroundColor: '#1A1A1A', borderRadius: '12px', padding: '20px', marginBottom: '24px', border: '1px solid rgba(255,255,255,0.08)' }}>
          <h3 style={{ color: '#fbbf24', fontSize: '18px', marginBottom: '12px' }}>⚠️ Produtos com Estoque Baixo</h3>
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
                    <td style={{ padding: '8px', color: 'white' }}>{p.nome}</td>
                    <td style={{ padding: '8px', color: '#fbbf24' }}>{p.quantidade || 0} {p.unidade_medida || 'un'}</td>
                    <td style={{ padding: '8px', color: '#9CA3AF' }}>{p.estoque_minimo || 5}</td>
                   </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div style={{ backgroundColor: '#1A1A1A', borderRadius: '12px', padding: '20px', border: '1px solid rgba(255,255,255,0.08)' }}>
        <h3 style={{ color: '#D95A1A', fontSize: '18px', marginBottom: '12px' }}>📊 Últimas Vendas</h3>
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
              {recentSales.length === 0 ? (
                 <tr>
                  <td colSpan="3" style={{ padding: '40px', textAlign: 'center', color: '#666' }}>Nenhuma venda registrada</td>
                 </tr>
              ) : (
                recentSales.map((s) => (
                  <tr key={s.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '8px', color: '#9CA3AF' }}>{format(new Date(s.created_at), 'dd/MM/yyyy')}</td>
                    <td style={{ padding: '8px', color: 'white' }}>{s.cliente_nome || 'Cliente avulso'}</td>
                    <td style={{ padding: '8px', color: '#4ade80' }}>{formatCurrency(s.total || s.valor_total || 0)}</td>
                   </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Dashboard