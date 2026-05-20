import React, { useEffect, useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'
import { format, parseISO, startOfMonth, subDays } from 'date-fns'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabase'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Loading from '../../components/ui/Loading'

const periodOptions = [
  { key: '30', label: 'Últimos 30 dias' },
  { key: '60', label: 'Últimos 60 dias' },
  { key: '90', label: 'Últimos 90 dias' },
  { key: 'month', label: 'Este mês' },
  { key: 'previous', label: 'Mês passado' }
]

const Reports = () => {
  const [sales, setSales] = useState([])
  const [saleItems, setSaleItems] = useState([])
  const [products, setProducts] = useState([])
  const [period, setPeriod] = useState('30')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [period])

  const loadData = async () => {
    setLoading(true)
    const now = new Date()
    let fromDate = subDays(now, Number(period))

    if (period === 'month') {
      fromDate = startOfMonth(now)
    }

    if (period === 'previous') {
      fromDate = startOfMonth(new Date(now.getFullYear(), now.getMonth() - 1, 1))
    }

    const [salesResult, itemsResult, productsResult] = await Promise.all([
      supabase.from('sales').select('*').gte('created_at', fromDate.toISOString()),
      supabase.from('sale_items').select('*'),
      supabase.from('products').select('*')
    ])

    if (salesResult.error) {
      toast.error('Erro ao carregar vendas: ' + salesResult.error.message)
      setSales([])
    } else {
      setSales(salesResult.data || [])
    }

    if (itemsResult.error) {
      toast.error('Erro ao carregar itens de venda: ' + itemsResult.error.message)
      setSaleItems([])
    } else {
      setSaleItems(itemsResult.data || [])
    }

    if (productsResult.error) {
      toast.error('Erro ao carregar produtos: ' + productsResult.error.message)
      setProducts([])
    } else {
      setProducts(productsResult.data || [])
    }

    setLoading(false)
  }

  const topSoldProducts = useMemo(() => {
    const counts = {}
    saleItems.forEach((item) => {
      if (!item.item_name) return
      counts[item.item_name] = (counts[item.item_name] || 0) + Number(item.quantity || 0)
    })
    return Object.entries(counts)
      .map(([name, quantity]) => ({ name, quantity }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 8)
  }, [saleItems])

  const revenueByMonth = useMemo(() => {
    const map = {}
    sales.forEach((sale) => {
      const date = sale.created_at ? parseISO(sale.created_at) : new Date()
      const key = format(date, 'yyyy-MM')
      const label = format(date, 'MMM/yyyy')
      map[key] = map[key] || { label, value: 0 }
      map[key].value += Number(sale.total_amount || 0)
    })
    return Object.values(map).sort((a, b) => (a.label > b.label ? 1 : -1))
  }, [sales])

  const revenueTotal = useMemo(
    () => sales.reduce((sum, sale) => sum + Number(sale.total_amount || 0), 0),
    [sales]
  )

  const lowStock = useMemo(
    () => products.filter((product) => Number(product.quantity || 0) <= Number(product.min_stock || 5)).slice(0, 8),
    [products]
  )

  const staleProducts = useMemo(() => {
    const threshold = subDays(new Date(), 180)
    return products.filter((product) => {
      if (!product.last_sold_at) return true
      return parseISO(product.last_sold_at) < threshold
    }).slice(0, 8)
  }, [products])

  const exportCsv = (filename, rows) => {
    const content = rows.map((row) => row.join(',')).join('\n')
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return <Loading message="Carregando relatórios..." />
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Relatórios</h1>
          <p className="page-description">Acompanhe faturamento, produtos mais vendidos e itens em risco de ruptura.</p>
        </div>
        <Button variant="secondary" size="md" onClick={() => exportCsv('produtos_vendidos.csv', [['Nome', 'Quantidade'], ...topSoldProducts.map((item) => [item.name, String(item.quantity)])])}>
          Exportar CSV
        </Button>
      </div>

      <div className="flex-row" style={{ flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
        {periodOptions.map((option) => (
          <Button
            key={option.key}
            variant={period === option.key ? 'secondary' : 'warning'}
            size="sm"
            onClick={() => setPeriod(option.key)}
          >
            {option.label}
          </Button>
        ))}
      </div>

      <div className="panel-row panel-row-3" style={{ marginBottom: 20 }}>
        <Card>
          <div style={{ color: 'rgba(224,224,224,.72)', marginBottom: 8 }}>Faturamento</div>
          <div style={{ fontSize: 26, fontWeight: 700, color: '#3A5F40' }}>R$ {revenueTotal.toFixed(2)}</div>
        </Card>
        <Card>
          <div style={{ color: 'rgba(224,224,224,.72)', marginBottom: 8 }}>Produtos mais vendidos</div>
          <div style={{ fontSize: 26, fontWeight: 700, color: '#D95A1A' }}>{topSoldProducts.length}</div>
        </Card>
        <Card>
          <div style={{ color: 'rgba(224,224,224,.72)', marginBottom: 8 }}>Estoque baixo</div>
          <div style={{ fontSize: 26, fontWeight: 700, color: '#F9A825' }}>{lowStock.length}</div>
        </Card>
      </div>

      <div className="panel-row panel-row-2" style={{ marginBottom: 20 }}>
        <Card>
          <div className="card-header">
            <h2 className="card-title">Produtos mais vendidos</h2>
          </div>
          {topSoldProducts.length === 0 ? (
            <p style={{ color: 'rgba(224,224,224,.72)' }}>Nenhum produto vendido no período.</p>
          ) : (
            <div style={{ width: '100%', minHeight: 300 }}>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topSoldProducts} margin={{ right: 20 }}>
                  <CartesianGrid stroke="#333" strokeDasharray="3 3" />
                  <XAxis dataKey="name" stroke="#E0E0E0" tick={{ fontSize: 12 }} />
                  <YAxis stroke="#E0E0E0" />
                  <Tooltip contentStyle={{ backgroundColor: '#1A1A1A', border: 'none', color: '#E0E0E0' }} />
                  <Bar dataKey="quantity" fill="#D95A1A" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card>
          <div className="card-header">
            <h2 className="card-title">Faturamento por mês</h2>
          </div>
          {revenueByMonth.length === 0 ? (
            <p style={{ color: 'rgba(224,224,224,.72)' }}>Sem dados para o período selecionado.</p>
          ) : (
            <div style={{ width: '100%', minHeight: 300 }}>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={revenueByMonth} margin={{ right: 10 }}>
                  <CartesianGrid stroke="#333" strokeDasharray="3 3" />
                  <XAxis dataKey="label" stroke="#E0E0E0" tick={{ fontSize: 12 }} />
                  <YAxis stroke="#E0E0E0" />
                  <Tooltip contentStyle={{ backgroundColor: '#1A1A1A', border: 'none', color: '#E0E0E0' }} />
                  <Line type="monotone" dataKey="value" stroke="#3A5F40" strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>

      <div className="panel-row panel-row-2" style={{ gap: 20 }}>
        <Card>
          <div className="card-header" style={{ marginBottom: 16 }}>
            <h2 className="card-title">Produtos parados</h2>
          </div>
          {staleProducts.length === 0 ? (
            <p style={{ color: 'rgba(224,224,224,.72)' }}>Nenhum produto sem venda nos últimos 6 meses.</p>
          ) : (
            <div style={{ display: 'grid', gap: 12 }}>
              {staleProducts.map((product) => (
                <div key={product.id} style={{ padding: 14, borderRadius: 16, background: '#262626' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                    <strong>{product.name}</strong>
                    <span style={{ color: '#D95A1A' }}>Estoque {product.quantity}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <div className="card-header" style={{ marginBottom: 16 }}>
            <h2 className="card-title">Produtos em ruptura</h2>
          </div>
          {lowStock.length === 0 ? (
            <p style={{ color: 'rgba(224,224,224,.72)' }}>Nenhum produto abaixo do estoque mínimo.</p>
          ) : (
            <div style={{ display: 'grid', gap: 12 }}>
              {lowStock.map((product) => (
                <div key={product.id} style={{ padding: 14, borderRadius: 16, background: '#262626' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                    <strong>{product.name}</strong>
                    <span style={{ color: '#F9A825' }}>Mínimo {product.min_stock || 5}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

export default Reports
