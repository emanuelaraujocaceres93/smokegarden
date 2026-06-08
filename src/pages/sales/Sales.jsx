import React, { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

const formatCurrency = (value) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)

export default function Sales() {
  const [estoque, setEstoque] = useState([])
  const [clientes, setClientes] = useState([])
  const [cart, setCart] = useState([])
  const [loading, setLoading] = useState(true)
  const [clienteId, setClienteId] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('pix')
  const [activeType, setActiveType] = useState('produto')
  const [searchTerm, setSearchTerm] = useState('')
  const [insumo, setInsumo] = useState({ descricao: '', quantidade: 1, valor_unitario: '' })

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    const [{ data: estoqueData, error: estoqueError }, { data: clientesData }] = await Promise.all([
      supabase.from('estoque').select('*').eq('ativo', true).order('nome'),
      supabase.from('pessoas').select('*').eq('tipo', 'cliente').order('nome')
    ])

    if (estoqueError) toast.error('Erro ao carregar estoque')
    setEstoque(estoqueData || [])
    setClientes(clientesData || [])
    setLoading(false)
  }

  const currentItems = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    return estoque.filter((item) => {
      const matchesType = item.tipo === activeType
      return matchesType && (!term || item.nome.toLowerCase().includes(term))
    })
  }, [estoque, activeType, searchTerm])

  const total = cart.reduce((sum, item) => sum + item.valor_total, 0)

  function addToCart(item) {
    const existing = cart.find((cartItem) => cartItem.estoque_id === item.id)
    if (existing) {
      setCart(cart.map((cartItem) =>
        cartItem.estoque_id === item.id
          ? { ...cartItem, quantidade: cartItem.quantidade + 1, valor_total: (cartItem.quantidade + 1) * cartItem.valor_unitario }
          : cartItem
      ))
    } else {
      setCart([...cart, {
        tipo_item: item.tipo,
        estoque_id: item.id,
        descricao: item.nome,
        quantidade: 1,
        valor_unitario: Number(item.valor) || 0,
        valor_total: Number(item.valor) || 0
      }])
    }
  }

  function updateQuantity(index, quantidade) {
    if (quantidade <= 0) {
      setCart(cart.filter((_, itemIndex) => itemIndex !== index))
      return
    }
    setCart(cart.map((item, itemIndex) =>
      itemIndex === index ? { ...item, quantidade, valor_total: quantidade * item.valor_unitario } : item
    ))
  }

  function addInsumo() {
    if (!insumo.descricao.trim()) return toast.error('Descreva o insumo')
    const quantidade = Number(insumo.quantidade) || 1
    const valorUnitario = Number(insumo.valor_unitario) || 0
    setCart([...cart, {
      tipo_item: 'insumo',
      estoque_id: null,
      descricao: insumo.descricao.trim(),
      quantidade,
      valor_unitario: valorUnitario,
      valor_total: quantidade * valorUnitario
    }])
    setInsumo({ descricao: '', quantidade: 1, valor_unitario: '' })
  }

  async function finalizeSale() {
    if (cart.length === 0) return toast.error('Adicione itens ao carrinho')

    const { data: config } = await supabase.from('configuracoes').select('chave_pix').limit(1).maybeSingle()
    const { data: pixPayload } = await supabase.rpc('gerar_qrcode_pix', {
      valor: total,
      chave_pix: config?.chave_pix || ''
    })

    const { data: venda, error: vendaError } = await supabase
      .from('vendas')
      .insert([{
        cliente_id: clienteId || null,
        valor_total: total,
        forma_pagamento: paymentMethod,
        status: 'concluida',
        qrcode_pix: paymentMethod === 'pix' ? pixPayload : null
      }])
      .select()
      .single()

    if (vendaError) return toast.error(vendaError.message)

    const itens = cart.map((item) => ({ ...item, venda_id: venda.id }))
    const { error: itensError } = await supabase.from('itens_venda').insert(itens)
    if (itensError) return toast.error(itensError.message)

    toast.success('Venda finalizada!')
    setCart([])
    setClienteId('')
    setPaymentMethod('pix')
  }

  if (loading) return <div className="page-empty">Carregando vendas...</div>

  return (
    <div style={{ padding: 16 }}>
      <div style={{ marginBottom: 20 }}>
        <h1 className="page-title">Vendas</h1>
        <p className="page-description">Carrinho com produtos, serviços e insumos.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(320px, 460px)', gap: 16 }}>
        <section className="panel">
          <div className="actions-row" style={{ marginBottom: 16 }}>
            <button className={`btn ${activeType === 'produto' ? 'btn-primary' : 'btn-secondary'} btn-md`} type="button" onClick={() => setActiveType('produto')}>Produtos</button>
            <button className={`btn ${activeType === 'servico' ? 'btn-primary' : 'btn-secondary'} btn-md`} type="button" onClick={() => setActiveType('servico')}>Serviços</button>
          </div>
          <input className="form-input" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Buscar..." style={{ marginBottom: 16 }} />
          <div className="modal-list" style={{ padding: 0 }}>
            {currentItems.map((item) => (
              <button key={item.id} className="product-button" type="button" onClick={() => addToCart(item)}>
                <div><strong>{item.nome}</strong></div>
                <small>{formatCurrency(item.valor)}</small>
              </button>
            ))}
            {currentItems.length === 0 && <div className="page-empty">Nenhum item encontrado.</div>}
          </div>
        </section>

        <aside className="panel">
          <h2 className="panel-title">Carrinho</h2>
          <select className="form-select" value={clienteId} onChange={(e) => setClienteId(e.target.value)} style={{ marginBottom: 12 }}>
            <option value="">Cliente avulso</option>
            {clientes.map((cliente) => <option key={cliente.id} value={cliente.id}>{cliente.nome}</option>)}
          </select>
          <select className="form-select" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} style={{ marginBottom: 16 }}>
            <option value="pix">Pix</option>
            <option value="dinheiro">Dinheiro</option>
            <option value="debito">Cartão débito</option>
            <option value="credito">Cartão crédito</option>
          </select>

          {cart.map((item, index) => (
            <div key={`${item.tipo_item}-${item.estoque_id || index}`} className="product-card-mobile" style={{ marginBottom: 10 }}>
              <strong>{item.descricao}</strong>
              <div className="actions-row">
                <input className="form-input" type="number" min="1" value={item.quantidade} onChange={(e) => updateQuantity(index, Number(e.target.value) || 1)} style={{ maxWidth: 92 }} />
                <span>{formatCurrency(item.valor_total)}</span>
                <button className="btn btn-danger btn-sm" type="button" onClick={() => updateQuantity(index, 0)}>Remover</button>
              </div>
            </div>
          ))}

          <div className="card" style={{ marginTop: 16 }}>
            <h3 className="panel-title">Insumo</h3>
            <input className="form-input" value={insumo.descricao} onChange={(e) => setInsumo({ ...insumo, descricao: e.target.value })} placeholder="Descrição" style={{ marginBottom: 8 }} />
            <div className="actions-row">
              <input className="form-input" type="number" min="1" value={insumo.quantidade} onChange={(e) => setInsumo({ ...insumo, quantidade: e.target.value })} style={{ maxWidth: 92 }} />
              <input className="form-input" type="number" step="0.01" min="0" value={insumo.valor_unitario} onChange={(e) => setInsumo({ ...insumo, valor_unitario: e.target.value })} placeholder="Valor" />
              <button className="btn btn-secondary btn-sm" type="button" onClick={addInsumo}>Adicionar</button>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20, fontWeight: 800 }}>
            <span>Total</span>
            <span>{formatCurrency(total)}</span>
          </div>
          <button className="btn btn-primary btn-lg" type="button" onClick={finalizeSale} style={{ width: '100%', marginTop: 16 }}>
            Finalizar venda
          </button>
        </aside>
      </div>
    </div>
  )
}
