import React, { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import toast from 'react-hot-toast'

const formatCurrency = (value) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)

export default function Sales() {
  const [estoque, setEstoque] = useState([])
  const [clientes, setClientes] = useState([])
  const [cart, setCart] = useState([])
  const [loading, setLoading] = useState(true)
  const [clienteId, setClienteId] = useState('')
  const [novoCliente, setNovoCliente] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('pix')
  const [activeType, setActiveType] = useState('produto')
  const [searchTerm, setSearchTerm] = useState('')
  const [insumo, setInsumo] = useState({ descricao: '', quantidade: 1, valor_unitario: '' })
  const [novoClienteEmail, setNovoClienteEmail] = useState('')
  const [novoClienteTelefone, setNovoClienteTelefone] = useState('')
  const [novoClienteNome, setNovoClienteNome] = useState('')

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

  async function resolveCliente() {
    if (clienteId) {
      const cliente = clientes.find(c => c.id === clienteId)
      return { id: clienteId, nome: cliente?.nome, email: cliente?.email, telefone: cliente?.telefone }
    }
    
    if (novoClienteNome.trim()) {
      const { data, error } = await supabase
        .from('pessoas')
        .insert([{ 
          tipo: 'cliente', 
          nome: novoClienteNome.trim(),
          email: novoClienteEmail || null,
          telefone: novoClienteTelefone || null
        }])
        .select()
        .single()

      if (error) throw error
      return { id: data.id, nome: data.nome, email: data.email, telefone: data.telefone }
    }
    
    return { id: null, nome: 'Cliente avulso', email: null, telefone: null }
  }

  async function finalizeSale() {
    if (cart.length === 0) return toast.error('Adicione itens ao carrinho')

    try {
      setLoading(true)
      
      const cliente = await resolveCliente()
      const totalVenda = cart.reduce((sum, item) => sum + item.valor_total, 0)

      const { data: venda, error: vendaError } = await supabase
        .from('vendas')
        .insert([{
          cliente_id: cliente.id || null,
          valor_total: totalVenda,
          forma_pagamento: paymentMethod,
          status: 'concluida',
          created_at: new Date().toISOString()
        }])
        .select()
        .single()

      if (vendaError) throw vendaError

      if (cart.length > 0) {
        const itens = cart.map((item) => ({ 
          venda_id: venda.id, 
          estoque_id: item.estoque_id,
          tipo_item: item.tipo_item,
          descricao: item.descricao,
          quantidade: item.quantidade,
          valor_unitario: item.valor_unitario,
          valor_total: item.valor_total
        }))
        
        const { error: itensError } = await supabase.from('venda_itens').insert(itens)
        if (itensError) console.error('Erro ao inserir itens:', itensError)
      }

      toast.success(`Venda finalizada com sucesso!`)
      setCart([])
      setClienteId('')
      setNovoClienteNome('')
      setNovoClienteEmail('')
      setNovoClienteTelefone('')
      
      fetchData()
    } catch (error) {
      console.error('Erro:', error)
      toast.error(error.message || 'Erro ao finalizar venda')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="loading-root"><div className="spinner"></div><p>Carregando...</p></div>

  return (
    <div className="sales-container">
      <div className="sales-header">
        <h1 className="sales-title">Vendas</h1>
        <p className="sales-description">Carrinho com produtos, serviços e insumos.</p>
      </div>

      <div className="sales-grid">
        {/* Esquerda - Produtos */}
        <div className="sales-products-panel">
          <div className="sales-type-buttons">
            <button 
              onClick={() => setActiveType('produto')} 
              className={`sales-type-btn ${activeType === 'produto' ? 'active' : ''}`}
            >
              Produtos
            </button>
            <button 
              onClick={() => setActiveType('servico')} 
              className={`sales-type-btn ${activeType === 'servico' ? 'active' : ''}`}
            >
              Serviços
            </button>
          </div>
          
          <input 
            type="text" 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            placeholder="Buscar..." 
            className="sales-search-input"
          />
          
          <div className="sales-items-list">
            {currentItems.map((item) => (
              <button 
                key={item.id} 
                onClick={() => addToCart(item)} 
                className="sales-item-btn"
              >
                <strong>{item.nome}</strong>
                <small>{formatCurrency(item.valor)}</small>
              </button>
            ))}
          </div>
        </div>

        {/* Direita - Carrinho */}
        <div className="sales-cart-panel">
          <h2 className="sales-cart-title">Carrinho</h2>
          
          <div className="sales-form-group">
            <label>Cliente existente</label>
            <select 
              value={clienteId} 
              onChange={(e) => { setClienteId(e.target.value); setNovoClienteNome('') }} 
              className="sales-select"
            >
              <option value="">Cliente avulso</option>
              {clientes.map((cliente) => <option key={cliente.id} value={cliente.id}>{cliente.nome}</option>)}
            </select>
          </div>

          {!clienteId && (
            <>
              <div className="sales-form-group">
                <label>Novo cliente</label>
                <input 
                  type="text" 
                  value={novoClienteNome} 
                  onChange={(e) => setNovoClienteNome(e.target.value)} 
                  placeholder="Nome" 
                  className="sales-input"
                />
              </div>
              <div className="sales-form-group">
                <label>Email</label>
                <input 
                  type="email" 
                  value={novoClienteEmail} 
                  onChange={(e) => setNovoClienteEmail(e.target.value)} 
                  placeholder="email@exemplo.com" 
                  className="sales-input"
                />
              </div>
              <div className="sales-form-group">
                <label>Telefone</label>
                <input 
                  type="text" 
                  value={novoClienteTelefone} 
                  onChange={(e) => setNovoClienteTelefone(e.target.value)} 
                  placeholder="(11) 99999-9999" 
                  className="sales-input"
                />
              </div>
            </>
          )}

          <div className="sales-form-group">
            <label>Forma de pagamento</label>
            <select 
              value={paymentMethod} 
              onChange={(e) => setPaymentMethod(e.target.value)} 
              className="sales-select"
            >
              <option value="pix">Pix</option>
              <option value="dinheiro">Dinheiro</option>
              <option value="debito">Cartão débito</option>
              <option value="credito">Cartão crédito</option>
            </select>
          </div>

          {/* Itens do carrinho */}
          <div className="sales-cart-items">
            {cart.map((item, index) => (
              <div key={index} className="sales-cart-item">
                <div className="sales-cart-item-header">
                  <strong>{item.descricao}</strong>
                  <button onClick={() => updateQuantity(index, 0)} className="sales-remove-btn">Remover</button>
                </div>
                <div className="sales-cart-item-controls">
                  <input 
                    type="number" 
                    min="1" 
                    value={item.quantidade} 
                    onChange={(e) => updateQuantity(index, Number(e.target.value) || 1)} 
                    className="sales-quantity-input"
                  />
                  <span className="sales-item-total">{formatCurrency(item.valor_total)}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Insumo */}
          <div className="sales-insumo-panel">
            <h3>Insumo</h3>
            <input 
              type="text" 
              value={insumo.descricao} 
              onChange={(e) => setInsumo({ ...insumo, descricao: e.target.value })} 
              placeholder="Descrição" 
              className="sales-input"
            />
            <div className="sales-insumo-controls">
              <input 
                type="number" 
                min="1" 
                value={insumo.quantidade} 
                onChange={(e) => setInsumo({ ...insumo, quantidade: e.target.value })} 
                placeholder="Qtd" 
                className="sales-insumo-qtd"
              />
              <input 
                type="number" 
                step="0.01" 
                value={insumo.valor_unitario} 
                onChange={(e) => setInsumo({ ...insumo, valor_unitario: e.target.value })} 
                placeholder="Valor" 
                className="sales-insumo-valor"
              />
              <button onClick={addInsumo} className="sales-insumo-add">+</button>
            </div>
          </div>

          {/* Total */}
          <div className="sales-total">
            <span>Total</span>
            <span>{formatCurrency(total)}</span>
          </div>

          <button onClick={finalizeSale} disabled={loading} className="sales-finalize-btn">
            {loading ? 'Finalizando...' : 'Finalizar Venda'}
          </button>
        </div>
      </div>

      <style jsx>{`
        .sales-container {
          padding: 24px;
          background-color: #1a1a1a;
          min-height: 100vh;
        }

        .sales-header {
          margin-bottom: 24px;
        }

        .sales-title {
          color: white;
          font-size: 28px;
          margin: 0;
        }

        .sales-description {
          color: #888;
          margin: 5px 0 0;
        }

        .sales-grid {
          display: grid;
          grid-template-columns: 1fr 400px;
          gap: 24px;
        }

        .sales-products-panel {
          background-color: #2a2a2a;
          border-radius: 12px;
          padding: 20px;
        }

        .sales-type-buttons {
          display: flex;
          gap: 12px;
          margin-bottom: 16px;
        }

        .sales-type-btn {
          padding: 8px 16px;
          background-color: #333;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
        }

        .sales-type-btn.active {
          background-color: #2563eb;
        }

        .sales-search-input {
          width: 100%;
          padding: 8px;
          background-color: #333;
          border: 1px solid #444;
          border-radius: 8px;
          color: white;
          margin-bottom: 16px;
        }

        .sales-items-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .sales-item-btn {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px;
          background-color: #333;
          border: 1px solid #444;
          border-radius: 8px;
          cursor: pointer;
          width: 100%;
          text-align: left;
          color: white;
        }

        .sales-item-btn small {
          color: #4ade80;
        }

        .sales-cart-panel {
          background-color: #2a2a2a;
          border-radius: 12px;
          padding: 20px;
        }

        .sales-cart-title {
          color: white;
          font-size: 18px;
          margin-bottom: 16px;
        }

        .sales-form-group {
          margin-bottom: 16px;
        }

        .sales-form-group label {
          color: #aaa;
          display: block;
          margin-bottom: 5px;
        }

        .sales-select, .sales-input {
          width: 100%;
          padding: 8px;
          background-color: #333;
          border: 1px solid #444;
          border-radius: 8px;
          color: white;
        }

        .sales-cart-items {
          margin-bottom: 16px;
        }

        .sales-cart-item {
          background-color: #333;
          padding: 12px;
          border-radius: 8px;
          margin-bottom: 8px;
        }

        .sales-cart-item-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .sales-cart-item-header strong {
          color: white;
        }

        .sales-remove-btn {
          padding: 4px 8px;
          background-color: #dc2626;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }

        .sales-cart-item-controls {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .sales-quantity-input {
          width: 80px;
          padding: 4px;
          background-color: #1a1a1a;
          border: 1px solid #444;
          border-radius: 4px;
          color: white;
        }

        .sales-item-total {
          color: #4ade80;
        }

        .sales-insumo-panel {
          background-color: #333;
          padding: 12px;
          border-radius: 8px;
          margin-top: 16px;
        }

        .sales-insumo-panel h3 {
          color: white;
          font-size: 14px;
          margin-bottom: 8px;
        }

        .sales-insumo-controls {
          display: flex;
          gap: 8px;
        }

        .sales-insumo-qtd {
          width: 60px;
          padding: 6px;
          background-color: #1a1a1a;
          border: 1px solid #444;
          border-radius: 4px;
          color: white;
        }

        .sales-insumo-valor {
          flex: 1;
          padding: 6px;
          background-color: #1a1a1a;
          border: 1px solid #444;
          border-radius: 4px;
          color: white;
        }

        .sales-insumo-add {
          padding: 6px 12px;
          background-color: #2563eb;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }

        .sales-total {
          display: flex;
          justify-content: space-between;
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid #444;
          font-weight: bold;
        }

        .sales-total span:first-child {
          color: white;
        }

        .sales-total span:last-child {
          color: #4ade80;
          font-size: 20px;
        }

        .sales-finalize-btn {
          width: 100%;
          margin-top: 16px;
          padding: 12px;
          background-color: #22c55e;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: bold;
        }

        .sales-finalize-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* Responsividade */
        @media (max-width: 768px) {
          .sales-container {
            padding: 16px;
          }

          .sales-grid {
            grid-template-columns: 1fr;
            gap: 16px;
          }

          .sales-title {
            font-size: 24px;
          }

          .sales-products-panel,
          .sales-cart-panel {
            padding: 16px;
          }

          .sales-item-btn {
            padding: 10px;
          }

          .sales-cart-item-header {
            flex-wrap: wrap;
            gap: 8px;
          }

          .sales-insumo-controls {
            flex-wrap: wrap;
          }

          .sales-insumo-qtd {
            width: 80px;
          }
        }

        @media (max-width: 480px) {
          .sales-type-buttons {
            flex-direction: column;
          }

          .sales-type-btn {
            width: 100%;
          }

          .sales-cart-item-controls {
            flex-wrap: wrap;
          }

          .sales-quantity-input {
            width: 100%;
          }
        }
      `}</style>
    </div>
  )
}