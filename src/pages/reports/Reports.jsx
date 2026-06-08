import React, { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

const PERIODS = [
  { value: 7, label: '7 dias' },
  { value: 30, label: '30 dias' },
  { value: 90, label: '90 dias' },
  { value: 365, label: '1 ano' }
]

const formatCurrency = (value) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)

export default function Reports() {
  const [period, setPeriod] = useState(30)
  const [loading, setLoading] = useState(true)
  const [vendas, setVendas] = useState([])
  const [itens, setItens] = useState([])
  const [clientes, setClientes] = useState([])

  useEffect(() => {
    fetchData()
  }, [period])

  async function fetchData() {
    setLoading(true)
    const start = new Date()
    start.setDate(start.getDate() - Number(period))

    try {
      const [{ data: vendasData, error: vendasError }, { data: itensData }, { data: clientesData }] = await Promise.all([
        supabase.from('vendas').select('*').gte('created_at', start.toISOString()).order('created_at', { ascending: false }),
        supabase.from('itens_venda').select('*'),
        supabase.from('pessoas').select('id,nome')
      ])
      if (vendasError) throw vendasError
      setVendas(vendasData || [])
      setItens(itensData || [])
      setClientes(clientesData || [])
    } catch (error) {
      toast.error('Erro ao carregar relatórios')
    } finally {
      setLoading(false)
    }
  }

  const clientesMap = useMemo(() => Object.fromEntries(clientes.map((cliente) => [cliente.id, cliente.nome])), [clientes])
  const vendaIds = useMemo(() => new Set(vendas.map((venda) => venda.id)), [vendas])
  const itensPeriodo = useMemo(() => itens.filter((item) => vendaIds.has(item.venda_id)), [itens, vendaIds])

  const stats = useMemo(() => {
    const faturamento = vendas.reduce((sum, venda) => sum + (venda.valor_total || 0), 0)
    const porForma = vendas.reduce((acc, venda) => {
      const forma = venda.forma_pagamento || 'nao_informado'
      acc[forma] = (acc[forma] || 0) + (venda.valor_total || 0)
      return acc
    }, {})
    const itensMaisVendidos = Object.values(itensPeriodo.reduce((acc, item) => {
      const key = item.descricao
      acc[key] = acc[key] || { descricao: item.descricao, quantidade: 0, valor: 0 }
      acc[key].quantidade += Number(item.quantidade) || 0
      acc[key].valor += Number(item.valor_total) || 0
      return acc
    }, {})).sort((a, b) => b.valor - a.valor).slice(0, 8)

    return { faturamento, porForma, itensMaisVendidos }
  }, [vendas, itensPeriodo])

  if (loading) return <div className="page-empty">Carregando relatórios...</div>

  return (
    <div style={{ padding: 16 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 className="page-title">Relatórios</h1>
        <p className="page-description">Resumo financeiro baseado nas vendas registradas.</p>
      </div>

      <div className="actions-row" style={{ marginBottom: 24 }}>
        {PERIODS.map((option) => (
          <button
            key={option.value}
            type="button"
            className={`btn ${period === option.value ? 'btn-primary' : 'btn-secondary'} btn-md`}
            onClick={() => setPeriod(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="public-grid" style={{ marginBottom: 24 }}>
        <div className="panel">
          <p className="text-muted">Vendas</p>
          <h2>{vendas.length}</h2>
        </div>
        <div className="panel">
          <p className="text-muted">Faturamento</p>
          <h2>{formatCurrency(stats.faturamento)}</h2>
        </div>
        <div className="panel">
          <p className="text-muted">Ticket médio</p>
          <h2>{formatCurrency(vendas.length ? stats.faturamento / vendas.length : 0)}</h2>
        </div>
      </div>

      <div className="grid-3">
        <section className="card card-section">
          <h2>Por pagamento</h2>
          {Object.entries(stats.porForma).map(([forma, valor]) => (
            <div key={forma} className="product-card-row">
              <span>{forma}</span>
              <strong>{formatCurrency(valor)}</strong>
            </div>
          ))}
          {Object.keys(stats.porForma).length === 0 && <div className="page-empty">Sem vendas no período.</div>}
        </section>

        <section className="card card-section card-span-2">
          <h2>Itens mais vendidos</h2>
          <div className="table-responsive">
            <table className="table compact">
              <thead><tr><th>Item</th><th>Quantidade</th><th>Valor</th></tr></thead>
              <tbody>
                {stats.itensMaisVendidos.map((item) => (
                  <tr key={item.descricao}>
                    <td>{item.descricao}</td>
                    <td>{item.quantidade}</td>
                    <td>{formatCurrency(item.valor)}</td>
                  </tr>
                ))}
                {stats.itensMaisVendidos.length === 0 && (
                  <tr><td colSpan="3" className="page-empty">Nenhum item vendido no período.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <section className="card">
        <h2>Últimas vendas</h2>
        <div className="table-responsive">
          <table className="table compact">
            <thead><tr><th>Data</th><th>Cliente</th><th>Pagamento</th><th>Total</th></tr></thead>
            <tbody>
              {vendas.slice(0, 20).map((venda) => (
                <tr key={venda.id}>
                  <td>{new Date(venda.created_at).toLocaleString('pt-BR')}</td>
                  <td>{clientesMap[venda.cliente_id] || 'Cliente avulso'}</td>
                  <td>{venda.forma_pagamento || '-'}</td>
                  <td>{formatCurrency(venda.valor_total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
