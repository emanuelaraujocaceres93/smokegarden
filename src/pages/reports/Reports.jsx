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
    received: 0,
    pending: 0,
    expensesPaid: 0,
    expensesPending: 0,
    netProfit: 0
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

  const deleteSale = async (saleId) => {
    try {
      await supabase.from('installments').delete().eq('sale_id', saleId)
      await supabase.from('sale_items').delete().eq('sale_id', saleId)
      const { error } = await supabase.from('sales').delete().eq('id', saleId)
      if (error) throw error
      toast.success('Venda excluída com sucesso!')
      setShowDeleteModal(null)
      fetchData()
    } catch (error) {
      toast.error('Erro ao excluir venda: ' + error.message)
    }
  }

  const deletePaidBill = async (billId) => {
    try {
      const { error } = await supabase.from('bills_to_pay').delete().eq('id', billId)
      if (error) throw error
      toast.success('Pagamento removido com sucesso!')
      setShowDeleteBillModal(null)
      fetchData()
    } catch (error) {
      toast.error('Erro ao remover pagamento: ' + error.message)
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
    
    const grossRevenue = (allSales || []).reduce((sum, s) => sum + (s.total_amount || 0), 0)
    const received = (allSales || []).reduce((sum, s) => sum + (s.paid_amount || 0), 0)
    const pending = grossRevenue - received
    const expensesPaid = (paidBills || []).reduce((sum, b) => sum + b.amount, 0)
    const expensesPending = (pendingBillsData || []).reduce((sum, b) => sum + b.amount, 0)
    const netProfit = received - expensesPaid
    
    const lowStock = (allProducts || []).filter(p => p.quantity <= (p.min_stock || 5))
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
    const stale = (allProducts || []).filter(p => {
      if (!p.last_sold_at) return true
      return new Date(p.last_sold_at) < sixMonthsAgo
    })
    
    const monthlyData = {}
    ;(allSales || []).forEach(sale => {
      const month = format(new Date(sale.created_at), 'MMM/yy')
      monthlyData[month] = (monthlyData[month] || 0) + (sale.total_amount || 0)
    })
    const monthlyChartData = Object.entries(monthlyData).map(([month, total]) => ({ month, total }))
    
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
    setPaidBillsList(paidBills || [])
    setPaymentMethods(methodsFormatted)
    setTopProducts(topProductsList)
    setTopServices(topServicesList)
    setLowStockList(lowStock.slice(0, 10))
    setStaleProducts(stale.slice(0, 10))
    setMonthlyRevenue(monthlyChartData)
    setStats({
      totalSales: (allSales || []).length,
      grossRevenue: grossRevenue,
      received: received,
      pending: pending,
      expensesPaid: expensesPaid,
      expensesPending: expensesPending,
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
    return <div style={{ textAlign: 'center', padding: '40px', color: '#9CA3AF' }}>Carregando...</div>
  }

  return (
    <div ref={reportRef} style={{ padding: '16px' }}>
      {/* Cabeçalho */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#D95A1A', margin: 0 }}>Relatórios</h1>
          <p style={{ color: '#9CA3AF', fontSize: '14px', marginTop: '4px' }}>Análise completa do negócio</p>
        </div>
        <button onClick={generatePDF} style={{ padding: '10px 20px', backgroundColor: '#D95A1A', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>📄 Exportar PDF</button>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '24px' }}>
        {periods.map(p => (
          <button key={p.value} onClick={() => setPeriod(p.value)} style={{ padding: '8px 16px', borderRadius: '8px', border: period === p.value ? 'none' : '1px solid #3A5F40', backgroundColor: period === p.value ? '#3A5F40' : 'transparent', color: period === p.value ? 'white' : '#E0E0E0', cursor: 'pointer' }}>
            {p.label}
          </button>
        ))}
      </div>

      {/* Gráficos */}
      {monthlyRevenue.length > 0 && (
        <div style={{ backgroundColor: '#1A1A1A', borderRadius: '12px', padding: '16px', marginBottom: '24px' }}>
          <h3 style={{ color: '#D95A1A', fontSize: '16px', marginBottom: '12px' }}>📊 Faturamento por Mês</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyRevenue}>
              <CartesianGrid strokeDasharray="3 3" stroke="#444" />
              <XAxis dataKey="month" stroke="#E0E0E0" />
              <YAxis stroke="#E0E0E0" />
              <Tooltip contentStyle={{ backgroundColor: '#1A1A1A', border: 'none' }} formatter={(value) => formatCurrency(value)} />
              <Bar dataKey="total" fill="#D95A1A" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {topProducts.length > 0 && (
        <div style={{ backgroundColor: '#1A1A1A', borderRadius: '12px', padding: '16px', marginBottom: '24px' }}>
          <h3 style={{ color: '#D95A1A', fontSize: '16px', marginBottom: '12px' }}>🏆 Produtos Mais Vendidos</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topProducts} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#444" />
              <XAxis type="number" stroke="#E0E0E0" />
              <YAxis type="category" dataKey="name" stroke="#E0E0E0" width={100} />
              <Tooltip contentStyle={{ backgroundColor: '#1A1A1A', border: 'none' }} />
              <Bar dataKey="quantity" fill="#3A5F40" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Cards Financeiros */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginBottom: '24px' }}>
        <div style={{ backgroundColor: '#1A1A1A', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
          <p style={{ color: '#9CA3AF', fontSize: '11px' }}>💰 Faturamento</p>
          <p style={{ fontSize: '20px', fontWeight: 'bold', color: '#D95A1A' }}>{formatCurrency(stats.grossRevenue)}</p>
        </div>
        <div style={{ backgroundColor: '#1A1A1A', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
          <p style={{ color: '#9CA3AF', fontSize: '11px' }}>✅ Recebido</p>
          <p style={{ fontSize: '20px', fontWeight: 'bold', color: '#2E7D32' }}>{formatCurrency(stats.received)}</p>
        </div>
        <div style={{ backgroundColor: '#1A1A1A', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
          <p style={{ color: '#9CA3AF', fontSize: '11px' }}>⏳ A Receber</p>
          <p style={{ fontSize: '20px', fontWeight: 'bold', color: '#F9A825' }}>{formatCurrency(stats.pending)}</p>
        </div>
        <div style={{ backgroundColor: '#1A1A1A', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
          <p style={{ color: '#9CA3AF', fontSize: '11px' }}>📉 Despesas Pagas</p>
          <p style={{ fontSize: '20px', fontWeight: 'bold', color: '#C62828' }}>{formatCurrency(stats.expensesPaid)}</p>
        </div>
        <div style={{ backgroundColor: '#1A1A1A', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
          <p style={{ color: '#9CA3AF', fontSize: '11px' }}>⚠️ A Pagar</p>
          <p style={{ fontSize: '20px', fontWeight: 'bold', color: '#F9A825' }}>{formatCurrency(stats.expensesPending)}</p>
        </div>
        <div style={{ backgroundColor: '#1A1A1A', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
          <p style={{ color: '#9CA3AF', fontSize: '11px' }}>⚖️ Lucro Líquido</p>
          <p style={{ fontSize: '20px', fontWeight: 'bold', color: stats.netProfit >= 0 ? '#2E7D32' : '#C62828' }}>{formatCurrency(stats.netProfit)}</p>
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
                <p style={{ fontSize: '11px', color: '#9CA3AF' }}>{m.method}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Produtos e Serviços Mais Vendidos */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {topProducts.length > 0 && (
          <div style={{ backgroundColor: '#1A1A1A', borderRadius: '12px', padding: '16px' }}>
            <h3 style={{ color: '#D95A1A', fontSize: '16px', marginBottom: '12px' }}>🏆 Produtos Mais Vendidos</h3>
            {topProducts.map((p, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: idx === topProducts.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.08)' }}>
                <span>{p.name}</span>
                <span style={{ color: '#F9A825' }}>{p.quantity} und</span>
              </div>
            ))}
          </div>
        )}

        {topServices.length > 0 && (
          <div style={{ backgroundColor: '#1A1A1A', borderRadius: '12px', padding: '16px' }}>
            <h3 style={{ color: '#D95A1A', fontSize: '16px', marginBottom: '12px' }}>🔧 Serviços Mais Vendidos</h3>
            {topServices.map((s, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: idx === topServices.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.08)' }}>
                <span>{s.name}</span>
                <span style={{ color: '#F9A825' }}>{s.quantity} und</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Estoque Baixo */}
      {lowStockList.length > 0 && (
        <div style={{ backgroundColor: '#1A1A1A', borderRadius: '12px', padding: '16px', marginBottom: '24px' }}>
          <h3 style={{ color: '#F9A825', fontSize: '16px', marginBottom: '12px' }}>⚠️ Produtos com Estoque Baixo</h3>
          {lowStockList.map(p => (
            <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <span>{p.name}</span>
              <span style={{ color: '#F9A825' }}>Estoque: {p.quantity}</span>
            </div>
          ))}
        </div>
      )}

      {/* Produtos Parados */}
      {staleProducts.length > 0 && (
        <div style={{ backgroundColor: '#1A1A1A', borderRadius: '12px', padding: '16px', marginBottom: '24px' }}>
          <h3 style={{ color: '#C62828', fontSize: '16px', marginBottom: '12px' }}>📦 Produtos Parados (+6 meses)</h3>
          {staleProducts.map(p => (
            <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <span>{p.name}</span>
              <span>Estoque: {p.quantity}</span>
            </div>
          ))}
        </div>
      )}

      {/* Fluxo de Caixa - Vendas */}
      {sales.length > 0 && (
        <div style={{ backgroundColor: '#1A1A1A', borderRadius: '12px', padding: '16px', marginBottom: '24px' }}>
          <h3 style={{ color: '#D95A1A', fontSize: '16px', marginBottom: '12px' }}>💰 Fluxo de Caixa - Vendas</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <th style={{ padding: '8px' }}>Data</th>
                  <th style={{ padding: '8px' }}>Cliente</th>
                  <th style={{ padding: '8px' }}>Total</th>
                  <th style={{ padding: '8px' }}>Status</th>
                  <th style={{ padding: '8px' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {sales.slice(0, 10).map((sale) => (
                  <tr key={sale.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '8px' }}>{format(new Date(sale.created_at), 'dd/MM/yyyy')}</td>
                    <td style={{ padding: '8px' }}>{sale.customer_name || '—'}</td>
                    <td style={{ padding: '8px', color: '#3A5F40', fontWeight: 'bold' }}>{formatCurrency(sale.total_amount)}</td>
                    <td style={{ padding: '8px' }}>
                      <span style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '11px', backgroundColor: sale.status === 'completed' ? '#2E7D3222' : '#C6282822', color: sale.status === 'completed' ? '#2E7D32' : '#C62828' }}>
                        {sale.status === 'completed' ? 'Pago' : 'Pendente'}
                      </span>
                    </td>
                    <td style={{ padding: '8px' }}>
                      <button onClick={() => setShowDeleteModal(sale)} style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', backgroundColor: '#C6282822', color: '#C62828', cursor: 'pointer' }}>Excluir</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Fluxo de Caixa - Despesas Pagas */}
      {paidBillsList.length > 0 && (
        <div style={{ backgroundColor: '#1A1A1A', borderRadius: '12px', padding: '16px' }}>
          <h3 style={{ color: '#C62828', fontSize: '16px', marginBottom: '12px' }}>📉 Fluxo de Caixa - Despesas Pagas</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <th style={{ padding: '8px' }}>Data Pagamento</th>
                  <th style={{ padding: '8px' }}>Descrição</th>
                  <th style={{ padding: '8px' }}>Valor</th>
                  <th style={{ padding: '8px' }}>Categoria</th>
                  <th style={{ padding: '8px' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {paidBillsList.map((bill) => (
                  <tr key={bill.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '8px' }}>{bill.paid_date ? format(new Date(bill.paid_date), 'dd/MM/yyyy') : format(new Date(bill.created_at), 'dd/MM/yyyy')}</td>
                    <td style={{ padding: '8px' }}>{bill.description} {bill.is_recurring && '🔄'}</td>
                    <td style={{ padding: '8px', color: '#C62828', fontWeight: 'bold' }}>{formatCurrency(bill.amount)}</td>
                    <td style={{ padding: '8px' }}>{bill.category}</td>
                    <td style={{ padding: '8px' }}>
                      <button onClick={() => setShowDeleteBillModal(bill)} style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', backgroundColor: '#C6282822', color: '#C62828', cursor: 'pointer' }}>Remover</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal de exclusão de venda */}
      {showDeleteModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div style={{ backgroundColor: '#1A1A1A', borderRadius: '12px', maxWidth: '400px', width: '100%', padding: '24px' }}>
            <h2 style={{ color: '#C62828', fontSize: '20px', marginBottom: '16px' }}>Confirmar Exclusão</h2>
            <p style={{ color: '#9CA3AF', marginBottom: '8px' }}>Tem certeza que deseja excluir esta venda?</p>
            <p style={{ color: '#E0E0E0', fontSize: '14px', marginBottom: '20px' }}>
              <strong>Cliente:</strong> {showDeleteModal.customer_name || 'Não informado'}<br />
              <strong>Valor:</strong> {formatCurrency(showDeleteModal.total_amount)}<br />
              <strong>Data:</strong> {format(new Date(showDeleteModal.created_at), 'dd/MM/yyyy HH:mm')}
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => deleteSale(showDeleteModal.id)} style={{ flex: 1, padding: '10px', backgroundColor: '#C62828', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Sim, Excluir</button>
              <button onClick={() => setShowDeleteModal(null)} style={{ flex: 1, padding: '10px', backgroundColor: 'transparent', border: '1px solid #9CA3AF', color: '#9CA3AF', borderRadius: '8px', cursor: 'pointer' }}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de remoção de despesa */}
      {showDeleteBillModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div style={{ backgroundColor: '#1A1A1A', borderRadius: '12px', maxWidth: '400px', width: '100%', padding: '24px' }}>
            <h2 style={{ color: '#C62828', fontSize: '20px', marginBottom: '16px' }}>Confirmar Remoção</h2>
            <p style={{ color: '#9CA3AF', marginBottom: '8px' }}>Tem certeza que deseja remover esta despesa paga?</p>
            <p style={{ color: '#E0E0E0', fontSize: '14px', marginBottom: '20px' }}>
              <strong>Descrição:</strong> {showDeleteBillModal.description}<br />
              <strong>Valor:</strong> {formatCurrency(showDeleteBillModal.amount)}<br />
              <strong>Data:</strong> {showDeleteBillModal.paid_date ? format(new Date(showDeleteBillModal.paid_date), 'dd/MM/yyyy') : format(new Date(showDeleteBillModal.created_at), 'dd/MM/yyyy')}
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => deletePaidBill(showDeleteBillModal.id)} style={{ flex: 1, padding: '10px', backgroundColor: '#C62828', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Sim, Remover</button>
              <button onClick={() => setShowDeleteBillModal(null)} style={{ flex: 1, padding: '10px', backgroundColor: 'transparent', border: '1px solid #9CA3AF', color: '#9CA3AF', borderRadius: '8px', cursor: 'pointer' }}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Reports