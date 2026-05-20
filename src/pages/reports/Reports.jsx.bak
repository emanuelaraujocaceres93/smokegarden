import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { format, subDays, subMonths, startOfDay, endOfDay } from 'date-fns'
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
    pendingAmount: 0
  })
  const [productsSold, setProductsSold] = useState([])
  const reportRef = useRef()

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
    
    const { data: saleItems } = await supabase.from('sale_items').select('*')
    
    const totalAmount = (allSales || []).reduce((sum, s) => sum + (s.total_amount || 0), 0)
    const paidAmount = (allSales || []).reduce((sum, s) => sum + (s.paid_amount || 0), 0)
    const pendingAmount = totalAmount - paidAmount
    
    const productCount = {}
    saleItems?.filter(i => i.item_type === 'product').forEach(item => {
      productCount[item.item_name] = (productCount[item.item_name] || 0) + (item.quantity || 0)
    })
    
    const topProducts = Object.entries(productCount)
      .map(([name, quantity]) => ({ name, quantity }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5)
    
    setSales(allSales || [])
    setProductsSold(topProducts)
    setStats({
      totalSales: (allSales || []).length,
      totalAmount: totalAmount,
      averageTicket: (allSales || []).length > 0 ? totalAmount / (allSales || []).length : 0,
      paidAmount: paidAmount,
      pendingAmount: pendingAmount
    })
    setLoading(false)
  }

  const formatCurrency = (value) => {
    return 'R$ ' + (value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  const generatePDF = () => {
    const element = reportRef.current
    const opt = {
      margin: [0.5, 0.5, 0.5, 0.5],
      filename: `relatorio_${period}_${format(new Date(), 'yyyy-MM-dd')}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, letterRendering: true },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    }
    html2pdf().set(opt).from(element).save()
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
      {/* Cabeçalho com filtros */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#D95A1A', margin: 0 }}>Relatórios</h1>
        <p style={{ color: '#9CA3AF', fontSize: '14px', marginTop: '4px' }}>Análise completa e exportação em PDF</p>
      </div>

      {/* Filtros e ações */}
      <div style={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '16px',
        marginBottom: '24px',
        backgroundColor: '#1A1A1A',
        padding: '16px',
        borderRadius: '12px'
      }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
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
                transition: 'all 0.2s ease',
                fontWeight: period === p.value ? 'bold' : 'normal'
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
        
        <button
          onClick={generatePDF}
          style={{
            padding: '10px 20px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: '#D95A1A',
            color: 'white',
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

      {/* Conteúdo do relatório para PDF */}
      <div ref={reportRef}>
        {/* Título do relatório */}
        <div style={{ textAlign: 'center', marginBottom: '24px', padding: '16px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#D95A1A', margin: 0 }}>Smoke Garden</h1>
          <p style={{ fontSize: '16px', color: '#9CA3AF', margin: '8px 0 0 0' }}>Mecânica 2 Tempos</p>
          <p style={{ fontSize: '14px', color: '#9CA3AF', margin: '4px 0 0 0' }}>
            Relatório de Vendas - Período: {getPeriodLabel()}
          </p>
          <p style={{ fontSize: '12px', color: '#6B7280', margin: '4px 0 0 0' }}>
            Gerado em {format(new Date(), 'dd/MM/yyyy HH:mm')}
          </p>
        </div>

        {/* Cards de estatísticas */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '32px',
          padding: '0 16px'
        }}>
          <div style={{ backgroundColor: '#1A1A1A', borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>💰</div>
            <p style={{ color: '#9CA3AF', fontSize: '14px', marginBottom: '4px' }}>Total de Vendas</p>
            <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#3A5F40' }}>{stats.totalSales}</p>
          </div>
          
          <div style={{ backgroundColor: '#1A1A1A', borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>💵</div>
            <p style={{ color: '#9CA3AF', fontSize: '14px', marginBottom: '4px' }}>Faturamento Total</p>
            <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#D95A1A' }}>{formatCurrency(stats.totalAmount)}</p>
          </div>
          
          <div style={{ backgroundColor: '#1A1A1A', borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>🎫</div>
            <p style={{ color: '#9CA3AF', fontSize: '14px', marginBottom: '4px' }}>Ticket Médio</p>
            <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#F9A825' }}>{formatCurrency(stats.averageTicket)}</p>
          </div>
          
          <div style={{ backgroundColor: '#1A1A1A', borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>✅</div>
            <p style={{ color: '#9CA3AF', fontSize: '14px', marginBottom: '4px' }}>Recebido</p>
            <p style={{ fontSize: '20px', fontWeight: 'bold', color: '#2E7D32' }}>{formatCurrency(stats.paidAmount)}</p>
          </div>
          
          <div style={{ backgroundColor: '#1A1A1A', borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>⏳</div>
            <p style={{ color: '#9CA3AF', fontSize: '14px', marginBottom: '4px' }}>A Receber</p>
            <p style={{ fontSize: '20px', fontWeight: 'bold', color: '#C62828' }}>{formatCurrency(stats.pendingAmount)}</p>
          </div>
        </div>

        {/* Produtos mais vendidos */}
        {productsSold.length > 0 && (
          <div style={{ backgroundColor: '#1A1A1A', borderRadius: '12px', padding: '20px', marginBottom: '32px', margin: '0 16px 32px 16px' }}>
            <h3 style={{ color: '#D95A1A', fontSize: '18px', marginBottom: '16px' }}>🏆 Produtos Mais Vendidos</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {productsSold.map((p, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <span style={{ fontWeight: 'bold' }}>{p.name}</span>
                  <span style={{ color: '#F9A825', fontWeight: 'bold' }}>{p.quantity} unidades</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tabela de vendas */}
        {sales.length > 0 && (
          <div style={{ backgroundColor: '#1A1A1A', borderRadius: '12px', padding: '20px', margin: '0 16px' }}>
            <h3 style={{ color: '#D95A1A', fontSize: '18px', marginBottom: '16px' }}>📋 Lista de Vendas</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', fontSize: '14px', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    <th style={{ padding: '12px 8px' }}>Data</th>
                    <th style={{ padding: '12px 8px' }}>Cliente</th>
                    <th style={{ padding: '12px 8px' }}>Total</th>
                    <th style={{ padding: '12px 8px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.map((sale, idx) => (
                    <tr key={sale.id} style={{ borderBottom: idx === sales.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding: '10px 8px' }}>{format(new Date(sale.created_at), 'dd/MM/yyyy')}</td>
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
                     </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Reports
