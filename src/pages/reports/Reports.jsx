import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { format, subDays, startOfDay, endOfDay } from 'date-fns'
import toast from 'react-hot-toast'
import html2pdf from 'html2pdf.js'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const Reports = () => {
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('month')
  const [sales, setSales] = useState([])
  const [paidBillsList, setPaidBillsList] = useState([])
  const [stats, setStats] = useState({
    totalSales: 0,
    grossRevenue: 0,
    totalCost: 0,
    grossProfit: 0,
    fees: 0,
    taxes: 0,
    expensesPaid: 0,
    netProfit: 0,
    netMargin: 0
  })
  const [paymentMethods, setPaymentMethods] = useState([])
  const [topProducts, setTopProducts] = useState([])
  const [topServices, setTopServices] = useState([])
  const [lowStockList, setLowStockList] = useState([])
  const [staleProducts, setStaleProducts] = useState([])
  const [monthlyRevenue, setMonthlyRevenue] = useState([])
  const [showDeleteModal, setShowDeleteModal] = useState(null)
  const [showDeleteBillModal, setShowDeleteBillModal] = useState(null)
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

  useEffect(() => { fetchData() }, [period])

  const getDateRange = () => {
    const end = new Date()
    let start = new Date()
    const periodObj = periods.find(p => p.value === period)
    const days = periodObj ? periodObj.days : 30
    start = subDays(end, days)
    return { start: startOfDay(start), end: endOfDay(end) }
  }

  const deleteSale = async (saleId) => {
    try {
      await supabase.from('installments').delete().eq('sale_id', saleId)
      await supabase.from('sale_items').delete().eq('sale_id', saleId)
      await supabase.from('sales').delete().eq('id', saleId)
      toast.success('Venda excluída!')
      setShowDeleteModal(null)
      fetchData()
    } catch (error) {
      toast.error('Erro ao excluir: ' + error.message)
    }
  }

  const deletePaidBill = async (billId) => {
    try {
      await supabase.from('bills_to_pay').delete().eq('id', billId)
      toast.success('Pagamento removido!')
      setShowDeleteBillModal(null)
      fetchData()
    } catch (error) {
      toast.error('Erro ao remover: ' + error.message)
    }
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
    
    const { data: paidBills } = await supabase
      .from('bills_to_pay')
      .select('*')
      .eq('paid', true)
      .gte('paid_date', start.toISOString().split('T')[0])
      .lte('paid_date', end.toISOString().split('T')[0])
    
    const today = new Date()
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)
    
    const { data: pendingBillsData } = await supabase
      .from('bills_to_pay')
      .select('*')
      .eq('paid', false)
      .gte('due_date', firstDayOfMonth.toISOString().split('T')[0])
      .lte('due_date', lastDayOfMonth.toISOString().split('T')[0])
    
    const { data: saleItems } = await supabase.from('sale_items').select('*')
    
    // Garantir que são arrays
    const salesArray = allSales || []
    const itemsArray = saleItems || []
    const paidArray = paidBills || []
    const pendingArray = pendingBillsData || []
    const productsArray = allProducts || []
    
    const grossRevenue = salesArray.reduce((sum, s) => sum + (s.total_amount || 0), 0)
    const totalCost = itemsArray.reduce((sum, i) => sum + (i.quantity || 0) * (i.purchase_price || 0), 0)
    const grossProfit = grossRevenue - totalCost
    const received = salesArray.reduce((sum, s) => sum + (s.paid_amount || 0), 0)
    const expensesPaid = paidArray.reduce((sum, b) => sum + b.amount, 0)
    const expensesPending = pendingArray.reduce((sum, b) => sum + b.amount, 0)
    const netProfit = received - expensesPaid
    
    // Produtos com estoque baixo
    const lowStock = productsArray.filter(p => p.quantity <= (p.min_stock || 5))
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
    const stale = productsArray.filter(p => !p.last_sold_at || new Date(p.last_sold_at) < sixMonthsAgo)
    
    // Métodos de pagamento
    const methods = {}
    salesArray.forEach(sale => {
      const method = sale.payment_method || 'outro'
      methods[method] = (methods[method] || 0) + 1
    })
    
    // Produtos e serviços mais vendidos
    const productCount = {}
    const serviceCount = {}
    itemsArray.forEach(item => {
      if (item.item_type === 'product') {
        productCount[item.item_name] = (productCount[item.item_name] || 0) + (item.quantity || 0)
      } else if (item.item_type === 'service') {
        serviceCount[item.item_name] = (serviceCount[item.item_name] || 0) + (item.quantity || 0)
      }
    })
    
    const topProductsList = Object.entries(productCount)
      .map(([name, qtd]) => ({ name, quantity: qtd }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5)
    
    const topServicesList = Object.entries(serviceCount)
      .map(([name, qtd]) => ({ name, quantity: qtd }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5)
    
    const monthlyData = {}
    salesArray.forEach(sale => {
      const month = format(new Date(sale.created_at), 'MMM/yy')
      monthlyData[month] = (monthlyData[month] || 0) + (sale.total_amount || 0)
    })
    const monthlyChartData = Object.entries(monthlyData).map(([month, total]) => ({ month, total }))
    
    const methodLabels = {
      cash: 'Dinheiro', pix: 'Pix', card_debit: 'Cartão Débito',
      card_credit: 'Cartão Crédito', installment: 'Parcelado', outro: 'Outro'
    }
    const methodsFormatted = Object.entries(methods).map(([key, value]) => ({
      method: methodLabels[key] || key, count: value
    }))
    
    setSales(salesArray)
    setPaidBillsList(paidArray)
    setPaymentMethods(methodsFormatted)
    setTopProducts(topProductsList)
    setTopServices(topServicesList)
    setLowStockList(lowStock.slice(0, 10))
    setStaleProducts(stale.slice(0, 10))
    setMonthlyRevenue(monthlyChartData)
    setStats({
      totalSales: salesArray.length,
      grossRevenue: grossRevenue,
      totalCost: totalCost,
      grossProfit: grossProfit,
      fees: 0,
      taxes: 0,
      expensesPaid: expensesPaid,
      netProfit: netProfit,
      netMargin: grossRevenue > 0 ? (netProfit / grossRevenue) * 100 : 0
    })
    setLoading(false)
  }

  const formatCurrency = (value) => 'R$ ' + (value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })
  
  const generatePDF = () => {
    if (!reportRef.current) return
    html2pdf().set({
      margin: [0.5, 0.5, 0.5, 0.5],
      filename: elatorio__.pdf,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    }).from(reportRef.current).save()
  }

  if (loading) return <div style={{ textAlign: 'center', padding: '40px' }}>Carregando...</div>

  return (
    <div ref={reportRef} style={{ padding: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div><h1 style={{ fontSize: '24px', color: '#D95A1A' }}>Relatórios</h1></div>
        <button onClick={generatePDF} style={{ padding: '10px 20px', background: '#D95A1A', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>📄 Exportar PDF</button>
      </div>
      
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '24px' }}>
        {periods.map(p => (
          <button key={p.value} onClick={() => setPeriod(p.value)} style={{ padding: '8px 16px', borderRadius: '8px', border: period === p.value ? 'none' : '1px solid #3A5F40', background: period === p.value ? '#3A5F40' : 'transparent', color: period === p.value ? 'white' : '#E0E0E0', cursor: 'pointer' }}>{p.label}</button>
        ))}
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginBottom: '24px' }}>
        <div style={{ background: '#1A1A1A', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
          <p style={{ color: '#9CA3AF' }}>💰 Faturamento</p>
          <p style={{ fontSize: '20px', fontWeight: 'bold', color: '#D95A1A' }}>{formatCurrency(stats.grossRevenue)}</p>
        </div>
        <div style={{ background: '#1A1A1A', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
          <p style={{ color: '#9CA3AF' }}>📦 CPV</p>
          <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#C62828' }}>{formatCurrency(stats.totalCost)}</p>
        </div>
        <div style={{ background: '#1A1A1A', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
          <p style={{ color: '#9CA3AF' }}>📈 Lucro Bruto</p>
          <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#3A5F40' }}>{formatCurrency(stats.grossProfit)}</p>
        </div>
        <div style={{ background: '#1A1A1A', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
          <p style={{ color: '#9CA3AF' }}>📉 Despesas Pagas</p>
          <p style={{ fontSize: '16px', fontWeight: 'bold', color: '#C62828' }}>{formatCurrency(stats.expensesPaid)}</p>
        </div>
        <div style={{ background: '#1A1A1A', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
          <p style={{ color: '#9CA3AF' }}>⚖️ Lucro Líquido</p>
          <p style={{ fontSize: '20px', fontWeight: 'bold', color: stats.netProfit >= 0 ? '#2E7D32' : '#C62828' }}>{formatCurrency(stats.netProfit)}</p>
        </div>
        <div style={{ background: '#1A1A1A', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
          <p style={{ color: '#9CA3AF' }}>📊 Margem</p>
          <p style={{ fontSize: '20px', fontWeight: 'bold', color: '#F9A825' }}>{stats.netMargin.toFixed(1)}%</p>
        </div>
      </div>
      
      {sales.length > 0 && (
        <div style={{ background: '#1A1A1A', borderRadius: '12px', padding: '16px' }}>
          <h3 style={{ color: '#D95A1A' }}>💰 Fluxo de Caixa - Vendas</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: '13px' }}>
              <thead><tr><th>Data</th><th>Cliente</th><th>Total</th><th>Status</th><th>Ações</th></tr></thead>
              <tbody>
                {sales.slice(0, 10).map(sale => (
                  <tr key={sale.id}>
                    <td>{format(new Date(sale.created_at), 'dd/MM/yyyy')}</td>
                    <td>{sale.customer_name || '—'}</td>
                    <td>{formatCurrency(sale.total_amount)}</td>
                    <td><span style={{ padding: '2px 8px', borderRadius: '12px', background: sale.status === 'completed' ? '#2E7D3222' : '#C6282822', color: sale.status === 'completed' ? '#2E7D32' : '#C62828' }}>{sale.status === 'completed' ? 'Pago' : 'Pendente'}</span></td>
                    <td><button onClick={() => setShowDeleteModal(sale)} style={{ padding: '6px 12px', background: '#C6282822', color: '#C62828', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Excluir</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {showDeleteModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#1A1A1A', borderRadius: '12px', padding: '24px', maxWidth: '400px' }}>
            <h2 style={{ color: '#C62828' }}>Confirmar Exclusão</h2>
            <p>Tem certeza que deseja excluir esta venda?</p>
            <button onClick={() => deleteSale(showDeleteModal.id)} style={{ padding: '10px', background: '#C62828', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', marginRight: '12px' }}>Sim, Excluir</button>
            <button onClick={() => setShowDeleteModal(null)} style={{ padding: '10px', background: 'transparent', border: '1px solid #9CA3AF', color: '#9CA3AF', borderRadius: '8px', cursor: 'pointer' }}>Cancelar</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Reports
