import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { format, subDays, subWeeks, subMonths, subYears, startOfDay, endOfDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Papa from 'papaparse'

const Reports = () => {
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('month')
  const [sales, setSales] = useState([])
  const [products, setProducts] = useState([])
  const [stats, setStats] = useState({
    totalSales: 0,
    totalProducts: 0,
    totalServices: 0,
    averageTicket: 0,
    topProduct: null,
    topService: null
  })
  const [salesData, setSalesData] = useState([])
  const [showExportModal, setShowExportModal] = useState(false)

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
    
    switch(period) {
      case 'day': start = startOfDay(end); break
      case 'week': start = subDays(end, 7); break
      case 'twoWeeks': start = subDays(end, 15); break
      case 'month': start = subMonths(end, 1); break
      case 'quarter': start = subMonths(end, 3); break
      case 'semester': start = subMonths(end, 6); break
      case 'year': start = subYears(end, 1); break
      default: start = subMonths(end, 1)
    }
    
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
    
    const { data: allProducts } = await supabase.from('products').select('*')
    const { data: allServices } = await supabase.from('services').select('*')
    const { data: saleItems } = await supabase.from('sale_items').select('*')
    
    setSales(allSales || [])
    setProducts(allProducts || [])
    
    const totalSalesAmount = (allSales || []).reduce((sum, s) => sum + s.total_amount, 0)
    const averageTicket = (allSales || []).length > 0 ? totalSalesAmount / (allSales || []).length : 0
    
    const productSales = {}
    saleItems?.filter(i => i.item_type === 'product').forEach(item => {
      productSales[item.item_name] = (productSales[item.item_name] || 0) + item.quantity
    })
    
    const topProduct = Object.entries(productSales).sort((a,b) => b[1] - a[1])[0]
    
    setStats({
      totalSales: (allSales || []).length,
      totalProducts: (allProducts || []).length,
      totalServices: (allServices || []).length,
      totalSalesAmount: totalSalesAmount,
      averageTicket: averageTicket,
      topProduct: topProduct ? { name: topProduct[0], quantity: topProduct[1] } : null
    })
    
    setSalesData(allSales || [])
    setLoading(false)
  }

  const formatCurrency = (value) => {
    return 'R$ ' + (value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  const exportToCSV = () => {
    const csvData = salesData.map(sale => ({
      'Data': format(new Date(sale.created_at), 'dd/MM/yyyy HH:mm'),
      'Cliente': sale.customer_name || 'Não informado',
      'Telefone': sale.customer_phone || 'Não informado',
      'Total': sale.total_amount,
      'Forma de Pagamento': sale.payment_method || 'Não informado',
      'Status': sale.status === 'completed' ? 'Pago' : 'Pendente',
      'Observações': sale.notes || ''
    }))
    
    const csv = Papa.unparse(csvData, { delimiter: ';' })
    const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.href = url
    link.setAttribute('download', `relatorio_vendas_${format(new Date(), 'yyyy-MM-dd')}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '40px', color: '#9CA3AF' }}>Carregando relatórios...</div>
  }

  return (
    <div style={{ padding: '16px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#D95A1A', margin: 0 }}>Relatórios</h1>
        <p style={{ color: '#9CA3AF', fontSize: '14px', marginTop: '4px' }}>Análise completa do negócio</p>
      </div>

      {/* Filtros rápidos */}
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
              transition: 'all 0.2s ease'
            }}
          >
            {p.label}
          </button>
        ))}
        
        <button
          onClick={() => setShowExportModal(true)}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: '1px solid #D95A1A',
            backgroundColor: '#D95A1A',
            color: 'white',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          📥 Exportar CSV
        </button>
      </div>

      {/* Cards de estatísticas */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '32px'
      }}>
        <div style={{ backgroundColor: '#1A1A1A', borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
          <div style={{ fontSize: '28px', marginBottom: '8px' }}>💰</div>
          <p style={{ color: '#9CA3AF', fontSize: '14px', marginBottom: '4px' }}>Total de Vendas</p>
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#3A5F40' }}>{stats.totalSales}</p>
        </div>
        
        <div style={{ backgroundColor: '#1A1A1A', borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
          <div style={{ fontSize: '28px', marginBottom: '8px' }}>💵</div>
          <p style={{ color: '#9CA3AF', fontSize: '14px', marginBottom: '4px' }}>Faturamento</p>
          <p style={{ fontSize: '20px', fontWeight: 'bold', color: '#D95A1A' }}>{formatCurrency(stats.totalSalesAmount)}</p>
        </div>
        
        <div style={{ backgroundColor: '#1A1A1A', borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
          <div style={{ fontSize: '28px', marginBottom: '8px' }}>🎫</div>
          <p style={{ color: '#9CA3AF', fontSize: '14px', marginBottom: '4px' }}>Ticket Médio</p>
          <p style={{ fontSize: '20px', fontWeight: 'bold', color: '#F9A825' }}>{formatCurrency(stats.averageTicket)}</p>
        </div>
        
        <div style={{ backgroundColor: '#1A1A1A', borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
          <div style={{ fontSize: '28px', marginBottom: '8px' }}>📦</div>
          <p style={{ color: '#9CA3AF', fontSize: '14px', marginBottom: '4px' }}>Produtos/Serviços</p>
          <p style={{ fontSize: '20px', fontWeight: 'bold', color: '#3A5F40' }}>{stats.totalProducts + stats.totalServices}</p>
        </div>
      </div>

      {/* Produto mais vendido */}
      {stats.topProduct && (
        <div style={{ backgroundColor: '#1A1A1A', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
          <h3 style={{ color: '#D95A1A', fontSize: '18px', marginBottom: '12px' }}>🏆 Produto Mais Vendido</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <span style={{ fontSize: '18px', fontWeight: 'bold' }}>{stats.topProduct.name}</span>
            <span style={{ color: '#F9A825', fontSize: '24px', fontWeight: 'bold' }}>{stats.topProduct.quantity} unidades</span>
          </div>
        </div>
      )}

      {/* Lista de vendas */}
      {salesData.length > 0 && (
        <div style={{ backgroundColor: '#1A1A1A', borderRadius: '12px', padding: '20px' }}>
          <h3 style={{ color: '#D95A1A', fontSize: '18px', marginBottom: '12px' }}>📋 Vendas do Período</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: '14px', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', color: '#9CA3AF', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <th style={{ padding: '8px' }}>Data</th>
                  <th style={{ padding: '8px' }}>Cliente</th>
                  <th style={{ padding: '8px' }}>Total</th>
                  <th style={{ padding: '8px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {salesData.slice(0, 10).map((sale) => (
                  <tr key={sale.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '8px' }}>{format(new Date(sale.created_at), 'dd/MM/yyyy HH:mm')}</td>
                    <td style={{ padding: '8px' }}>{sale.customer_name || '—'}</td>
                    <td style={{ padding: '8px', color: '#3A5F40', fontWeight: 'bold' }}>{formatCurrency(sale.total_amount)}</td>
                    <td style={{ padding: '8px' }}>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '12px',
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
          {salesData.length > 10 && (
            <p style={{ textAlign: 'center', color: '#9CA3AF', fontSize: '12px', marginTop: '12px' }}>
              Mostrando 10 de {salesData.length} vendas. Exporte o CSV para ver todas.
            </p>
          )}
        </div>
      )}

      {/* Modal de Exportação */}
      {showExportModal && (
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
            <h2 style={{ color: '#D95A1A', fontSize: '20px', marginBottom: '16px' }}>Exportar Relatório</h2>
            <p style={{ color: '#9CA3AF', marginBottom: '20px' }}>
              O relatório será exportado com todos os dados do período selecionado.
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => {
                  exportToCSV()
                  setShowExportModal(false)
                }}
                style={{
                  flex: 1,
                  padding: '10px',
                  backgroundColor: '#3A5F40',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                Confirmar Exportação
              </button>
              <button
                onClick={() => setShowExportModal(false)}
                style={{
                  flex: 1,
                  padding: '10px',
                  backgroundColor: 'transparent',
                  color: '#C62828',
                  border: '1px solid #C62828',
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
