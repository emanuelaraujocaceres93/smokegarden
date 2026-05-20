import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { format, subMonths, isAfter, isBefore } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Card from '../../components/ui/Card'
import PageHeader from '../../components/ui/PageHeader'

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
    
    const lowStock = products?.filter(p => p.quantity <= (p.min_stock || 5)) || []
    
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
    
    const expiring = products?.filter(p => {
      if (!p.has_expiry || !p.expiry_date) return false
      const expiryDate = new Date(p.expiry_date)
      return isAfter(expiryDate, new Date()) && isBefore(expiryDate, thirtyDaysFromNow)
    }) || []
    
    const recent = sales?.sort((a, b) => 
      new Date(b.created_at) - new Date(a.created_at)
    ).slice(0, 5) || []
    
    setStats({
      totalSalesMonth: sales?.reduce((sum, s) => sum + s.total_amount, 0) || 0,
      totalProducts: products?.length || 0,
      lowStockProducts: lowStock.length,
      pendingPayments: installments?.length || 0,
      productsExpiring: expiring.length
    })
    
    setLowStockList(lowStock.slice(0, 10))
    setRecentSales(recent)
    setLoading(false)
  }

  if (loading) {
    return <div className="flex justify-center items-center h-64 text-grayLight">Carregando dashboard...</div>
  }

  const StatCard = ({ label, value, color }) => (
    <Card className="text-center">
      <p className="text-grayLight text-sm mb-1">{label}</p>
      <p className={	ext-2xl md:text-3xl font-bold }>{value}</p>
    </Card>
  )

  return (
    <div className="p-4 md:p-6">
      <PageHeader title="Dashboard" description="Visão geral do negócio" />
      
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <StatCard label="Vendas do Mês" value={R$ } color="text-garden" />
        <StatCard label="Total Produtos" value={stats.totalProducts} color="text-burnt" />
        <StatCard label="Estoque Baixo" value={stats.lowStockProducts} color="text-alertYellow" />
        <StatCard label="Pendentes" value={stats.pendingPayments} color="text-alertRed" />
        <StatCard label="A Vencer" value={stats.productsExpiring} color="text-alertYellow" />
      </div>

      {lowStockList.length > 0 && (
        <Card title="⚠️ Produtos com Estoque Baixo" className="mb-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border">
                <tr className="text-left text-grayLight">
                  <th className="py-2">Produto</th>
                  <th className="py-2">Estoque</th>
                  <th className="py-2">Mínimo</th>
                </tr>
              </thead>
              <tbody>
                {lowStockList.map(p => (
                  <tr key={p.id} className="border-b border-border/50">
                    <td className="py-2">{p.name}</td>
                    <td className="py-2 text-alertYellow">{p.quantity}</td>
                    <td className="py-2">{p.min_stock || 5}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {recentSales.length > 0 && (
        <Card title="Últimas Vendas">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border">
                <tr className="text-left text-grayLight">
                  <th className="py-2">Data</th>
                  <th className="py-2">Cliente</th>
                  <th className="py-2">Total</th>
                </tr>
              </thead>
              <tbody>
                {recentSales.map(s => (
                  <tr key={s.id} className="border-b border-border/50">
                    <td className="py-2">{format(new Date(s.created_at), 'dd/MM/yyyy')}</td>
                    <td className="py-2">{s.customer_name || '—'}</td>
                    <td className="py-2">R$ {s.total_amount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}

export default Dashboard
