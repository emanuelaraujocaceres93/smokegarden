import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { format, subDays, startOfDay, endOfDay } from 'date-fns'
import toast from 'react-hot-toast'
import html2pdf from 'html2pdf.js'

const Reports = () => {
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('month')
  const [sales, setSales] = useState([])
  const [stats, setStats] = useState({
    totalSales: 0,
    totalAmount: 0,
    averageTicket: 0,
    paidAmount: 0,
    pendingAmount: 0,
    expensesPaid: 0,
    netProfit: 0
  })
  const [paymentMethods, setPaymentMethods] = useState({})
  const [topProducts, setTopProducts] = useState([])
  const [topServices, setTopServices] = useState([])
  const reportRef = useRef(null)

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
    
    const { data: allSales } = await supabase
      .from('sales')
      .select('*')
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString())
      .order('created_at', { ascending: false })
    
    const { data: paidBills } = await supabase
      .from('bills_to_pay')
      .select('*')
      .eq('paid', true)
      .gte('paid_date', start.toISOString().split('T')[0])
      .lte('paid_date', end.toISOString().split('T')[0])
    
    const { data: saleItems } = await supabase.from('sale_items').select('*')
    
    const totalAmount = (allSales || []).reduce((sum, s) => sum + (s.total_amount || 0), 0)
    const paidAmount = (allSales || []).reduce((sum, s) => sum + (s.paid_amount || 0), 0)
    const expensesPaid = (paidBills || []).reduce((sum, b) => sum + b.amount, 0)
    const netProfit = paidAmount - expensesPaid
    
    const methods = {}
    ;(allSales || []).forEach(sale => {
      const method = sale.payment_method || 'outro'
      methods[method] = (methods[method] || 0) + 1
    })
    
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
      pendingAmount: totalAmount - paidAmount,
      expensesPaid: expensesPaid,
      netProfit: netProfit
    })
    setLoading(false)
  }

  const formatCurrency = (value) => {
    return 'R$ ' + (value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })
  }

  const generatePDF = () => {
    const element = reportRef.current
    if (!element) {
      toast.error('Erro ao gerar PDF')
      return
    }
    const opt = {
      margin: [0.5, 0.5, 0.5, 0.5],
      filename: `relatorio_${period}_${format(new Date(), 'yyyy-MM-dd')}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, letterRendering: true },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    }
    html2pdf().set(opt).from(element).save()
  }

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '40px', color: '#9CA3AF' }}>Carregando relatórios...</div>
  }

  return (
    <div ref={reportRef} style={{ padding: '16px' }}>
      {/* Cabeçalho com botão PDF */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#D95A1A', margin: 0 }}>Relatórios</h1>
          <p style={{ color: '#9CA3AF', fontSize: '14px', marginTop: '4px' }}>Análise completa do negócio</p>
        </div>
        <button
          onClick={generatePDF}
          style={{
            padding: '10px 20px',
            backgroundColor: '#D95A1A',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          📄 Exportar PDF
        </button>
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
              cursor: 'pointer'
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Cards Financeiros */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: '12px',
        marginBottom: '24px'
      }}>
        <div style={{ backgroundColor: '#1A1A1A', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
          <p style={{ color: '#9CA3AF', fontSize: '12px', marginBottom: '4px' }}>💰 Faturamento Bruto</p>
          <p style={{ fontSize: '20px', fontWeight: 'bold', color: '#D95A1A' }}>{formatCurrency(stats.totalAmount)}</p>
        </div>
        <div style={{ backgroundColor: '#1A1A1A', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
          <p style={{ color: '#9CA3AF', fontSize: '12px', marginBottom: '4px' }}>✅ Recebido</p>
          <p style={{ fontSize: '20px', fontWeight: 'bold', color: '#2E7D32' }}>{formatCurrency(stats.paidAmount)}</p>
        </div>
        <div style={{ backgroundColor: '#1A1A1A', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
          <p style={{ color: '#9CA3AF', fontSize: '12px', marginBottom: '4px' }}>📉 Despesas Pagas</p>
          <p style={{ fontSize: '20px', fontWeight: 'bold', color: '#C62828' }}>{formatCurrency(stats.expensesPaid)}</p>
        </div>
        <div style={{ backgroundColor: '#1A1A1A', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
          <p style={{ color: '#9CA3AF', fontSize: '12px', marginBottom: '4px' }}>⚖️ Lucro Líquido</p>
          <p style={{ fontSize: '20px', fontWeight: 'bold', color: stats.netProfit >= 0 ? '#2E7D32' : '#C62828' }}>
            {formatCurrency(stats.netProfit)}
          </p>
        </div>
      </div>

      {/* Resumo de vendas */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: '12px',
        marginBottom: '24px'
      }}>
        <div style={{ backgroundColor: '#1A1A1A', borderRadius: '12px', padding: '12px', textAlign: 'center' }}>
          <p style={{ color: '#9CA3AF', fontSize: '11px' }}>Total de Vendas</p>
          <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#3A5F40' }}>{stats.totalSales}</p>
        </div>
        <div style={{ backgroundColor: '#1A1A1A', borderRadius: '12px', padding: '12px', textAlign: 'center' }}>
          <p style={{ color: '#9CA3AF', fontSize: '11px' }}>Ticket Médio</p>
          <p style={{ fontSize: '16px', fontWeight: 'bold', color: '#F9A825' }}>{formatCurrency(stats.averageTicket)}</p>
        </div>
        <div style={{ backgroundColor: '#1A1A1A', borderRadius: '12px', padding: '12px', textAlign: 'center' }}>
          <p style={{ color: '#9CA3AF', fontSize: '11px' }}>A Receber</p>
          <p style={{ fontSize: '16px', fontWeight: 'bold', color: '#F9A825' }}>{formatCurrency(stats.pendingAmount)}</p>
        </div>
      </div>

      {/* Métodos de Pagamento */}
      {paymentMethods.length > 0 && (
        <div style={{ backgroundColor: '#1A1A1A', borderRadius: '12px', padding: '16px', marginBottom: '24px' }}>
          <h3 style={{ color: '#D95A1A', fontSize: '16px', marginBottom: '12px' }}>💳 Métodos de Pagamento</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
            {paymentMethods.map(m => (
              <div key={m.method} style={{ flex: 1, minWidth: '80px', textAlign: 'center', padding: '8px', backgroundColor: '#2C2C2C', borderRadius: '8px' }}>
                <p style={{ fontSize: '20px', fontWeight: 'bold', color: '#D95A1A', margin: 0 }}>{m.count}</p>
                <p style={{ fontSize: '11px', color: '#9CA3AF', margin: '4px 0 0 0' }}>{m.method}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Produtos e Serviços */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {topProducts.length > 0 && (
          <div style={{ backgroundColor: '#1A1A1A', borderRadius: '12px', padding: '16px' }}>
            <h3 style={{ color: '#D95A1A', fontSize: '16px', marginBottom: '12px' }}>🏆 Produtos Mais Vendidos</h3>
            {topProducts.map((p, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: idx === topProducts.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.08)' }}>
                <span style={{ fontSize: '13px' }}>{p.name}</span>
                <span style={{ color: '#F9A825', fontSize: '13px', fontWeight: 'bold' }}>{p.quantity} und</span>
              </div>
            ))}
          </div>
        )}

        {topServices.length > 0 && (
          <div style={{ backgroundColor: '#1A1A1A', borderRadius: '12px', padding: '16px' }}>
            <h3 style={{ color: '#D95A1A', fontSize: '16px', marginBottom: '12px' }}>🔧 Serviços Mais Vendidos</h3>
            {topServices.map((s, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: idx === topServices.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.08)' }}>
                <span style={{ fontSize: '13px' }}>{s.name}</span>
                <span style={{ color: '#F9A825', fontSize: '13px', fontWeight: 'bold' }}>{s.quantity} und</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lista de Vendas */}
      {sales.length > 0 && (
        <div style={{ backgroundColor: '#1A1A1A', borderRadius: '12px', padding: '16px' }}>
          <h3 style={{ color: '#D95A1A', fontSize: '16px', marginBottom: '12px' }}>📋 Últimas Vendas</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <th style={{ padding: '8px' }}>Data</th>
                  <th style={{ padding: '8px' }}>Cliente</th>
                  <th style={{ padding: '8px' }}>Total</th>
                  <th style={{ padding: '8px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {sales.slice(0, 10).map((sale) => (
                  <tr key={sale.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '8px' }}>{format(new Date(sale.created_at), 'dd/MM/yyyy')}</td>
                    <td style={{ padding: '8px' }}>{sale.customer_name || '—'}</td>
                    <td style={{ padding: '8px', color: '#3A5F40', fontWeight: 'bold' }}>{formatCurrency(sale.total_amount)}</td>
                    <td style={{ padding: '8px' }}>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        backgroundColor: sale.status === 'completed' ? '#2E7D3222' : '#C6282822',
                        color: sale.status === 'completed' ? '#2E7D32' : '#C62828'
                      }}>
                        {sale.status === 'completed' ? 'Pago' : 'Pendente'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {sales.length > 10 && <p style={{ textAlign: 'center', fontSize: '11px', color: '#9CA3AF', marginTop: '12px' }}>Mostrando 10 de {sales.length} vendas</p>}
        </div>
      )}
    </div>
  )
}

export default Reports