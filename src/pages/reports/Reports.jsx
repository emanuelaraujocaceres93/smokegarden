import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { format, subDays, subMonths, startOfDay, endOfDay } from 'date-fns'
import toast from 'react-hot-toast'

const Reports = () => {
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('month')
  const [sales, setSales] = useState([])
  const [stats, setStats] = useState({
    totalSales: 0,
    totalAmount: 0,
    averageTicket: 0,
    paidAmount: 0,
    pendingAmount: 0
  })
  const [paymentMethods, setPaymentMethods] = useState({})
  const [topProducts, setTopProducts] = useState([])
  const [topServices, setTopServices] = useState([])
  const [showDeleteModal, setShowDeleteModal] = useState(null)

  const periods = [
    { value: 'day', label: 'Hoje', days: 1 },
    { value: 'week', label: 'Semana', days: 7 },
    { value: 'twoWeeks', label: 'Quinzena', days: 15 },
    { value: 'month', label: 'Mês', days: 30 },
    { value: 'quarter', label: 'Trimestre', days: 90 },
    { value: 'semester', label: 'Semestre', days: 180 },
    { value: 'year', label: 'Ano', days: 365 }
  ]

  useEffect(() => {
    fetchData()
  }, [period])

  const getDateRange = () => {
    const end = new Date()
    let start = new Date()
    const periodObj = periods.find(p => p.value === period)
    const days = periodObj ? periodObj.days : 30
    start = subDays(end, days)
    return { start: startOfDay(start), end: endOfDay(end) }
  }

  const fetchData = async () => {
    setLoading(true)
    const { start, end } = getDateRange()
    
    // Buscar vendas
    const { data: allSales } = await supabase
      .from('sales')
      .select('*')
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString())
      .order('created_at', { ascending: false })
    
    // Buscar itens de venda
    const { data: saleItems } = await supabase
      .from('sale_items')
      .select('*')
    
    // Calcular estatísticas
    const totalAmount = (allSales || []).reduce((sum, s) => sum + (s.total_amount || 0), 0)
    const paidAmount = (allSales || []).reduce((sum, s) => sum + (s.paid_amount || 0), 0)
    
    // Métodos de pagamento
    const methods = {}
    ;(allSales || []).forEach(sale => {
      const method = sale.payment_method || 'outro'
      methods[method] = (methods[method] || 0) + 1
    })
    
    // Produtos mais vendidos
    const productCount = {}
    const serviceCount = {}
    
    saleItems?.forEach(item => {
      if (item.item_type === 'product') {
        productCount[item.item_name] = (productCount[item.item_name] || 0) + (item.quantity || 0)
      } else if (item.item_type === 'service') {
        serviceCount[item.item_name] = (serviceCount[item.item_name] || 0) + (item.quantity || 0)
      }
    })
    
    const topProductsList = Object.entries(productCount)
      .map(([name, quantity]) => ({ name, quantity }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5)
    
    const topServicesList = Object.entries(serviceCount)
      .map(([name, quantity]) => ({ name, quantity }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5)
    
    const methodLabels = {
      cash: 'Dinheiro',
      pix: 'Pix',
      card_debit: 'Cartão Débito',
      card_credit: 'Cartão Crédito',
      installment: 'Parcelado',
      outro: 'Outro'
    }
    
    const methodsFormatted = Object.entries(methods).map(([key, value]) => ({
      method: methodLabels[key] || key,
      count: value
    }))
    
    setSales(allSales || [])
    setPaymentMethods(methodsFormatted)
    setTopProducts(topProductsList)
    setTopServices(topServicesList)
    setStats({
      totalSales: (allSales || []).length,
      totalAmount: totalAmount,
      averageTicket: (allSales || []).length > 0 ? totalAmount / (allSales || []).length : 0,
      paidAmount: paidAmount,
      pendingAmount: totalAmount - paidAmount
    })
    setLoading(false)
  }

  const deleteSale = async (saleId) => {
    try {
      // Deletar parcelas
      await supabase.from('installments').delete().eq('sale_id', saleId)
      // Deletar itens da venda
      await supabase.from('sale_items').delete().eq('sale_id', saleId)
      // Deletar venda
      const { error } = await supabase.from('sales').delete().eq('id', saleId)
      
      if (error) throw error
      
      toast.success('Venda excluída com sucesso!')
      setShowDeleteModal(null)
      fetchData()
    } catch (error) {
      toast.error('Erro ao excluir venda: ' + error.message)
    }
  }

  const formatCurrency = (value) => {
    return 'R$ ' + (value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  const getPeriodLabel = () => {
    const p = periods.find(p => p.value === period)
    return p ? p.label : 'Mês'
  }

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '40px', color: '#9CA3AF' }}>Carregando relatórios...</div>
  }

  return (
    <div style={{ padding: '16px' }}>
      {/* Cabeçalho */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#D95A1A', margin: 0 }}>Relatórios</h1>
        <p style={{ color: '#9CA3AF', fontSize: '14px', marginTop: '4px' }}>Análise completa do negócio</p>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '24px' }}>
        {periods.map(p => (
          <button
            key={p.value}
            onClick={() => setPeriod(p.value)}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: period === p.value ? 'none' : '1px solid #3A5F40',
              backgroundColor: period === p.value ? '#3A5F40' : 'transparent',
              color: period === p.value ? 'white' : '#E0E0E0',
              cursor: 'pointer',
              fontWeight: period === p.value ? 'bold' : 'normal'
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Cards de estatísticas */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div style={{ backgroundColor: '#1A1A1A', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: '28px' }}>💰</div>
          <p style={{ color: '#9CA3AF', fontSize: '12px', marginBottom: '4px' }}>Total de Vendas</p>
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#3A5F40' }}>{stats.totalSales}</p>
        </div>
        
        <div style={{ backgroundColor: '#1A1A1A', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: '28px' }}>💵</div>
          <p style={{ color: '#9CA3AF', fontSize: '12px', marginBottom: '4px' }}>Faturamento</p>
          <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#D95A1A' }}>{formatCurrency(stats.totalAmount)}</p>
        </div>
        
        <div style={{ backgroundColor: '#1A1A1A', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: '28px' }}>🎫</div>
          <p style={{ color: '#9CA3AF', fontSize: '12px', marginBottom: '4px' }}>Ticket Médio</p>
          <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#F9A825' }}>{formatCurrency(stats.averageTicket)}</p>
        </div>
        
        <div style={{ backgroundColor: '#1A1A1A', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: '28px' }}>✅</div>
          <p style={{ color: '#9CA3AF', fontSize: '12px', marginBottom: '4px' }}>Recebido</p>
          <p style={{ fontSize: '16px', fontWeight: 'bold', color: '#2E7D32' }}>{formatCurrency(stats.paidAmount)}</p>
        </div>
        
        <div style={{ backgroundColor: '#1A1A1A', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: '28px' }}>⏳</div>
          <p style={{ color: '#9CA3AF', fontSize: '12px', marginBottom: '4px' }}>A Receber</p>
          <p style={{ fontSize: '16px', fontWeight: 'bold', color: '#C62828' }}>{formatCurrency(stats.pendingAmount)}</p>
        </div>
      </div>

      {/* Métodos de Pagamento */}
      {paymentMethods.length > 0 && (
        <div style={{ backgroundColor: '#1A1A1A', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
          <h3 style={{ color: '#D95A1A', fontSize: '18px', marginBottom: '16px' }}>💳 Métodos de Pagamento</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
            {paymentMethods.map(m => (
              <div key={m.method} style={{ flex: 1, minWidth: '100px', textAlign: 'center', padding: '12px', backgroundColor: '#2C2C2C', borderRadius: '8px' }}>
                <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#D95A1A', margin: 0 }}>{m.count}</p>
                <p style={{ fontSize: '12px', color: '#9CA3AF', margin: '4px 0 0 0' }}>{m.method}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Produtos e Serviços Mais Vendidos */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '24px' }}>
        {topProducts.length > 0 && (
          <div style={{ backgroundColor: '#1A1A1A', borderRadius: '12px', padding: '20px' }}>
            <h3 style={{ color: '#D95A1A', fontSize: '18px', marginBottom: '16px' }}>🏆 Produtos Mais Vendidos</h3>
            {topProducts.map((p, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: idx === topProducts.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.08)' }}>
                <span style={{ fontWeight: 'bold' }}>{p.name}</span>
                <span style={{ color: '#F9A825', fontWeight: 'bold' }}>{p.quantity} und</span>
              </div>
            ))}
          </div>
        )}

        {topServices.length > 0 && (
          <div style={{ backgroundColor: '#1A1A1A', borderRadius: '12px', padding: '20px' }}>
            <h3 style={{ color: '#D95A1A', fontSize: '18px', marginBottom: '16px' }}>🔧 Serviços Mais Vendidos</h3>
            {topServices.map((s, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: idx === topServices.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.08)' }}>
                <span style={{ fontWeight: 'bold' }}>{s.name}</span>
                <span style={{ color: '#F9A825', fontWeight: 'bold' }}>{s.quantity} und</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lista de Vendas com botão excluir */}
      {sales.length > 0 && (
        <div style={{ backgroundColor: '#1A1A1A', borderRadius: '12px', padding: '20px' }}>
          <h3 style={{ color: '#D95A1A', fontSize: '18px', marginBottom: '16px' }}>📋 Lista de Vendas</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: '14px', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <th style={{ padding: '12px 8px' }}>Data</th>
                  <th style={{ padding: '12px 8px' }}>Cliente</th>
                  <th style={{ padding: '12px 8px' }}>Total</th>
                  <th style={{ padding: '12px 8px' }}>Status</th>
                  <th style={{ padding: '12px 8px' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((sale, idx) => (
                  <tr key={sale.id} style={{ borderBottom: idx === sales.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '10px 8px' }}>{format(new Date(sale.created_at), 'dd/MM/yyyy HH:mm')}</td>
                    <td style={{ padding: '10px 8px' }}>{sale.customer_name || '—'}</td>
                    <td style={{ padding: '10px 8px', color: '#3A5F40', fontWeight: 'bold' }}>{formatCurrency(sale.total_amount)}</td>
                    <td style={{ padding: '10px 8px' }}>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        backgroundColor: sale.status === 'completed' ? '#2E7D3222' : '#C6282822',
                        color: sale.status === 'completed' ? '#2E7D32' : '#C62828'
                      }}>
                        {sale.status === 'completed' ? 'Pago' : 'Pendente'}
                      </span>
                    </td>
                    <td style={{ padding: '10px 8px' }}>
                      <button
                        onClick={() => setShowDeleteModal(sale)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '6px',
                          border: 'none',
                          backgroundColor: '#C6282822',
                          color: '#C62828',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal de confirmação de exclusão */}
      {showDeleteModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '16px'
        }}>
          <div style={{ backgroundColor: '#1A1A1A', borderRadius: '12px', maxWidth: '400px', width: '100%', padding: '24px' }}>
            <h2 style={{ color: '#C62828', fontSize: '20px', marginBottom: '16px' }}>Confirmar Exclusão</h2>
            <p style={{ color: '#9CA3AF', marginBottom: '8px' }}>
              Tem certeza que deseja excluir esta venda?
            </p>
            <p style={{ color: '#E0E0E0', fontSize: '14px', marginBottom: '20px' }}>
              <strong>Cliente:</strong> {showDeleteModal.customer_name || 'Não informado'}<br />
              <strong>Valor:</strong> {formatCurrency(showDeleteModal.total_amount)}<br />
              <strong>Data:</strong> {format(new Date(showDeleteModal.created_at), 'dd/MM/yyyy HH:mm')}
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => deleteSale(showDeleteModal.id)}
                style={{
                  flex: 1,
                  padding: '10px',
                  backgroundColor: '#C62828',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                Sim, Excluir
              </button>
              <button
                onClick={() => setShowDeleteModal(null)}
                style={{
                  flex: 1,
                  padding: '10px',
                  backgroundColor: 'transparent',
                  color: '#9CA3AF',
                  border: '1px solid #9CA3AF',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Reports
