import React, { useEffect, useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'
import { supabase } from '../../lib/supabase'
import { format, isBefore, parseISO, subMonths } from 'date-fns'
import { useAuth } from '../../contexts/AuthContext'
import Card from '../../components/ui/Card'
import Table from '../../components/ui/Table'
import Loading from '../../components/ui/Loading'
import toast from 'react-hot-toast'

const Dashboard = () => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [products, setProducts] = useState([])
  const [sales, setSales] = useState([])
  const [installments, setInstallments] = useState([])
  const [saleItems, setSaleItems] = useState([])

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      const firstDay = new Date()
      firstDay.setDate(1)
      firstDay.setHours(0, 0, 0, 0)

      const [productsResult, salesResult, installmentsResult, saleItemsResult] = await Promise.all([
        supabase.from('products').select('*').order('name', { ascending: true }),
        supabase.from('sales').select('*').gte('created_at', firstDay.toISOString()),
        supabase.from('installments').select('*').neq('status', 'paid'),
        supabase.from('sale_items').select('*')
      ])

      if (productsResult.error) {
        toast.error('Erro ao buscar produtos: ' + productsResult.error.message)
        setProducts([])
      } else {
        setProducts(productsResult.data || [])
      }

      if (salesResult.error) {
        toast.error('Erro ao buscar vendas: ' + salesResult.error.message)
        setSales([])
      } else {
        setSales(salesResult.data || [])
      }

      if (installmentsResult.error) {
        toast.error('Erro ao buscar parcelas: ' + installmentsResult.error.message)
        setInstallments([])
      } else {
        setInstallments(installmentsResult.data || [])
      }

      if (saleItemsResult.error) {
        toast.error('Erro ao buscar itens de venda: ' + saleItemsResult.error.message)
        setSaleItems([])
      } else {
        setSaleItems(saleItemsResult.data || [])
      }

      setLoading(false)
    }

    loadData()
  }, [])

  const lowStockProducts = useMemo(
    () => products.filter((product) => Number(product.quantity || 0) <= Number(product.min_stock || 5)),
    [products]
  )

  const staleProducts = useMemo(() => {
    const threshold = subMonths(new Date(), 6)
    return products.filter((product) => {
      if (!product.last_sold_at) return true
      return isBefore(parseISO(product.last_sold_at), threshold)
    })
  }, [products])

  const topProducts = useMemo(() => {
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

  if (loading) {
    return <Loading message="Carregando dashboard..." />
  }

  const totalSalesMonth = sales.reduce((sum, item) => sum + Number(item.total_amount || 0), 0)
  const totalProducts = products.length
  const pendingPayments = installments.length
  const expiringProducts = products.filter((product) => {
    if (!product.expiry_date) return false

    const expiry = parseISO(product.expiry_date)
    const now = new Date()
    const threshold = new Date()
    threshold.setDate(now.getDate() + 30)

    return expiry > now && expiry <= threshold
  }).length

  const stockDistribution = [
    { name: 'Estoque Baixo', value: lowStockProducts.length },
    { name: 'Estoque Normal', value: totalProducts - lowStockProducts.length },
    { name: 'A vencer', value: expiringProducts }
  ]

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-description">Olá, {user?.email || 'Operador'}. Confira os principais indicadores do mês.</p>
        </div>
      </div>

      <div className="panel-row panel-row-3">
        <Card>
          <div className="card-actions" style={{ justifyContent: 'space-between' }}>
            <div>
              <div style={{ color: 'rgba(224,224,224,0.72)', marginBottom: 10 }}>Vendas do mês</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--garden)' }}>
                R$ {totalSalesMonth.toFixed(2)}
              </div>
            </div>
          </div>
        </Card>
        <Card>
          <div className="card-actions" style={{ justifyContent: 'space-between' }}>
            <div>
              <div style={{ color: 'rgba(224,224,224,0.72)', marginBottom: 10 }}>Total de produtos</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--burnt)' }}>{totalProducts}</div>
            </div>
          </div>
        </Card>
        <Card>
          <div className="card-actions" style={{ justifyContent: 'space-between' }}>
            <div>
              <div style={{ color: 'rgba(224,224,224,0.72)', marginBottom: 10 }}>Estoque baixo</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--alertYellow)' }}>{lowStockProducts.length}</div>
            </div>
          </div>
        </Card>
      </div>

      <div className="panel-row panel-row-3" style={{ marginTop: 20 }}>
        <Card>
          <div>
            <div style={{ color: 'rgba(224,224,224,0.72)', marginBottom: 8 }}>Pendentes</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--alertRed)' }}>{pendingPayments}</div>
          </div>
        </Card>
        <Card>
          <div>
            <div style={{ color: 'rgba(224,224,224,0.72)', marginBottom: 8 }}>A vencer</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--alertYellow)' }}>{expiringProducts}</div>
          </div>
        </Card>
      </div>

      <div className="panel-row panel-row-2" style={{ marginTop: 24 }}>
        <Card>
          <div className="card-header">
            <h2 className="card-title">Produtos mais vendidos</h2>
          </div>
          {topProducts.length === 0 ? (
            <div style={{ color: 'rgba(224,224,224,0.7)' }}>Nenhum item vendido ainda.</div>
          ) : (
            <div style={{ width: '100%', minHeight: 300 }}>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topProducts} margin={{ right: 16 }}>
                  <CartesianGrid stroke="#333" strokeDasharray="3 3" />
                  <XAxis dataKey="name" stroke="#E0E0E0" tick={{ fontSize: 12 }} />
                  <YAxis stroke="#E0E0E0" />
                  <Tooltip contentStyle={{ background: '#1A1A1A', border: 'none', color: '#E0E0E0' }} />
                  <Bar dataKey="quantity" fill="var(--burnt)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card>
          <div className="card-header">
            <h2 className="card-title">Visão de estoque</h2>
          </div>
          <Table headers={['Produto', 'Quantidade', 'Mínimo']}>
            {lowStockProducts.length === 0 ? (
              <tr>
                <td colSpan="3" style={{ padding: 16, color: 'rgba(224,224,224,0.72)' }}>
                  Nenhum produto com estoque baixo.
                </td>
              </tr>
            ) : (
              lowStockProducts.map((product) => (
                <tr key={product.id}>
                  <td>{product.name}</td>
                  <td>{product.quantity}</td>
                  <td>{product.min_stock || 5}</td>
                </tr>
              ))
            )}
          </Table>
        </Card>
      </div>

      <div className="panel-row panel-row-2" style={{ marginTop: 24 }}>
        <Card>
          <div className="card-header">
            <h2 className="card-title">Produtos parados</h2>
          </div>
          <Table headers={['Produto', 'Última venda', 'Estoque']}>
            {staleProducts.length === 0 ? (
              <tr>
                <td colSpan="3" style={{ padding: 16, color: 'rgba(224,224,224,0.72)' }}>
                  Nenhum produto sem venda nos últimos 6 meses.
                </td>
              </tr>
            ) : (
              staleProducts.map((product) => (
                <tr key={product.id}>
                  <td>{product.name}</td>
                  <td>{product.last_sold_at ? format(parseISO(product.last_sold_at), 'dd/MM/yyyy') : 'Nunca'}</td>
                  <td>{product.quantity}</td>
                </tr>
              ))
            )}
          </Table>
        </Card>

        <Card>
          <div className="card-header">
            <h2 className="card-title">Distribuição de estoque</h2>
          </div>
          <div style={{ width: '100%', minHeight: 300 }}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stockDistribution} margin={{ right: 16 }}>
                <CartesianGrid stroke="#333" strokeDasharray="3 3" />
                <XAxis dataKey="name" stroke="#E0E0E0" tick={{ fontSize: 12 }} />
                <YAxis stroke="#E0E0E0" />
                <Tooltip contentStyle={{ background: '#1A1A1A', border: 'none', color: '#E0E0E0' }} />
                <Bar dataKey="value" fill="var(--garden)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default Dashboard
